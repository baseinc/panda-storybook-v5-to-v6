import * as ts from 'typescript'
import * as fs from 'fs'
import {
  getExportAssignmentProperties,
  getFilteredImport,
  createTemplateVariableStatementAst,
  getArgsAst,
  syntaxKindToName,
  createExportAssignmentAst,
  GodClass
} from './modules'

// - [x] 5/31 時点で置換できないファイルのパターンを列挙する
// - [x] コンポーネント名が取得できないパターンを列挙する
// - [x] utf-8 の文字を decode する
// - [x] ディレクトリが存在しない場合の対処法を記述する → ディレクトリを作成するようにした
// - [x] HTML に対応する
//    - [x] コンポーネントを import しない
//    - [x] Storybook のコンポーネントに HTML と命名する
// - [x] changelog.md の import パスを変更する
//    - [x] changelog.md を doc で読めるようにする（メタ情報に呼び出す）
// - [x] values の import パスを変更する
// - [x] Device に対応する（device: select(`device`, devices, 'pc'),） → select の対応で解決した
// - [x] number('foo', 1) のように、 number を args に持っていく
// - [x] select を args に持っていく
// - [x] 未使用の import を削除する → no-unused-vars で解決させる
// - [x] propsDescription の扱いを相談する

// 以下は対応しない
// - [ ] 複数 Template に対応する
// - [ ] icon と AppsIcon のどちらも Element/Icon の名前になるので名前を分ける
// - [ ] map(div).join('') しているのを template 内に埋め込む（`<div>${template}</div>` なので、`<div>${some.map().join('')}</div>` に変える）
// - [ ] v6 のコンポーネントの書き方を Kibela に書いて共有する
//    - [ ] hygen でテンプレートを用意する
// - upload-box.stories.js
//    - [x] multiple: boolean('multiple'), を multiple: boolean('multiple', false) に書き換える → kibela に書いた

// web
// - [ ] mounted に対応
// - [ ] render(h) に対応
// - [ ] コンポーネントのパスは `./` ではなく、元のものを使う

/**
 * 動かすために
 * 1. tsconfig.json の module を commonjs にする
 * 2. ts-node, ts-paths をインストールする
 */

/**
 * アプローチ
 * 1. ファイル書き換え
 * → だめ。新しい行を挿入する方法が面倒
 *
 * 2. 旧ファイルから必要な要素を抽出。要素を組み合わせて新ファイルに吐き出す
 */
const [, , input, output] = process.argv

if (!input || !output) {
  throw new Error('Arg input or output is undefined.')
}

const target = input
const outputFilename = output

// const target = 'bbq/stories/elements/balloon/balloon-html.stories.js'
// const outputFilename = target.replace('/stories', '')
const shouldOutputAstText = false

const code = fs.readFileSync(target, 'utf8')

const hasV6Flag = true
const sourceFile = ts.createSourceFile(outputFilename, code, ts.ScriptTarget.Latest)

// ------------------------------
// setup
// ------------------------------
let prevText = ''
let component = ''
let title = ''
const isHTML = false
const godClass = new GodClass()

// ------------------------------
// traverse
// ------------------------------
function printRecursive (node: ts.Node, sourceFile: ts.SourceFile) {
  const syntaxKind = syntaxKindToName(node.kind)
  const text = node.getText(sourceFile)
  const textWithSyntaxKind = `${syntaxKind}: ${text}`

  if (shouldOutputAstText) {
    console.log(textWithSyntaxKind)
  }

  // import 文
  if (ts.isImportDeclaration(node)) {
    godClass.addImport(text)

    if (text.includes('README')) {
      godClass.setHasReadme(true)
    }

    if (text.includes('addon-actions')) {
      godClass.setHasAction(true)
    }
  }

  // SB コンポーネント名
  if (godClass.isPrevStoriesOf(prevText) && !godClass.includesStorybook(text)) {
    // replaceAll が動かない？
    // "" を削除
    title = text.substring(1, text.length - 1)
  }

  // Vue コンポーネント名
  if (ts.isPropertyAssignment(node) && text.startsWith('\'bbq-')) {
    component = (node.initializer as any).escapedText
  }

  // parameters
  if (ts.isObjectLiteralExpression(node) && godClass.includesInfoOrNotes(text)) {
    godClass.setParameters(node)
  }

  // template
  if ((ts.isTemplateExpression(node) || syntaxKind === 'FirstTemplateToken') && godClass.isVueTemplate(text)) {
    // `` を削除
    // TODO \$ の \ も取り除きたい → replaceAll を使いたい
    godClass.setTemplate(text.substring(1, text.length - 1))
  }

  // data()
  if (ts.isMethodDeclaration(node) && godClass.isDataMethod(text)) {
    godClass.setDataMethodReturnValue((node.body?.statements as any)[0].expression || null)
  }

  // methods
  if (ts.isPropertyAssignment(node) && godClass.isMethods(text)) {
    godClass.setMethods(node)
  }

  // knob
  if (ts.isCallExpression(node)) {
    const args = node.arguments
    godClass.addKnobVariable(args, text)
  }

  prevText = textWithSyntaxKind
  node.forEachChild(child => {
    printRecursive(child, sourceFile)
  })
}

printRecursive(sourceFile, sourceFile)

// ------------------------------
// 値
// ------------------------------
const {
  imports,
  hasReadme,
  template,
  dataMethodReturnValue,
  methods,
  knobVariables
} = godClass.getAll()

// ------------------------------
// component 名を決定する
// ------------------------------
component = component || title.split('/').pop() || ''

if (!component) {
  throw new Error('Component 名を取得できません。')
}

// ------------------------------
// import
// ------------------------------
const filteredImport = getFilteredImport(imports, { hasReadme })

// ------------------------------
// export default
// ------------------------------
// 元の Storybook コンポーネント名と区別するために V6 でディレクトリを分ける
const storybookComponentTitle = hasV6Flag ? `V6/${title}` : title
const exportAssignmentProperties = getExportAssignmentProperties({ title: storybookComponentTitle, component, knobVariables }, { hasReadme, isHTML })
const exportAssignmentAst = createExportAssignmentAst(exportAssignmentProperties)

// ------------------------------
// Storybook の const Template = () => ()
// ------------------------------
const templateVariableStatementAst = createTemplateVariableStatementAst({ methods, component, template, isHTML })

// ------------------------------
// args
// ------------------------------
const argsAst = getArgsAst({ dataMethodReturnValue, knobVariables })

// ------------------------------
// printer
// ------------------------------
const printer = ts.createPrinter()
const printNode = (node: ts.Node) => printer.printNode(
  ts.EmitHint.Unspecified,
  node,
  ts.createSourceFile('', '', ts.ScriptTarget.Latest)
)

const exportAssignment = printNode(exportAssignmentAst)
const templateVariableStatement = printNode(templateVariableStatementAst)
const args = printNode(argsAst)

// 「${foo}」が「\${foo}」になるため、「\${foo}」→「{{ foo }}」に変換
const templateVariableDeclaration = templateVariableStatement.replace(/\\\$?.*}/g, (match) => {
  let varName = match.replace('\\$', '')
  varName = varName.substring(1, varName.length - 1)
  return `{{ ${varName} }}`
})

// args を探索する
// - [ ] select を削除 → 手動で削除
// - [x] text, boolean, number はメソッドではなく値にする
// - [ ] 改行する

// パースがうまくいかないので変数宣言として扱う
const declaration = 'const args = '
const argsDeclaration = `const args = ${args}`
const argsSourceFile = ts.createSourceFile('', argsDeclaration, ts.ScriptTarget.Latest)
const argsTransformerFactory: ts.TransformerFactory<ts.Node> = (ctx: ts.TransformationContext) => {
  return (rootNode) => {
    const visit = (node: ts.Node): ts.Node => {
      node = ts.visitEachChild(node, visit, ctx)

      if (!ts.isCallExpression(node)) {
        return node
      }

      let funcName = node.expression.getText(argsSourceFile)
      const value = (node.arguments[1] as any).text

      if (syntaxKindToName(node.arguments[1].kind) === 'TrueKeyword') {
        // boolean は `.text`が null になる
        funcName = 'boolean'
      }

      switch (funcName) {
        case 'text':
          return ctx.factory.createStringLiteral(value)
        case 'number':
          return ctx.factory.createNumericLiteral(value || 0)
        case 'boolean':
          return syntaxKindToName(node.arguments[1].kind) === 'TrueKeyword' ? ctx.factory.createTrue() : ctx.factory.createFalse()
        default:
          break
      }

      return node
    }

    return ts.visitNode(rootNode, visit)
  }
}

const argsTransformationResult = ts.transform(argsSourceFile, [argsTransformerFactory])
const argsResult = argsTransformationResult.transformed[0]
const transformedArgs = printNode(argsResult).replace(declaration, '')

// ------------------------------
// file
// ------------------------------
const newFile = `${filteredImport}

${exportAssignment.normalize('NFC')}

${templateVariableDeclaration}

export const Default = Template.bind({})
Default.args = ${transformedArgs}
`

// utf-8 を unescape
const unescape = (text :string) =>
  text.replace(/\\u.{4}/g, (match) => {
    // 返り値の string 型を強制的に number 型に変換する
    const charCode = match.replace('\\u', '0x') as any as number
    return String.fromCharCode(charCode)
  })

const escaped = unescape(newFile)
fs.writeFileSync(outputFilename, escaped)
