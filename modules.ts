import * as ts from 'typescript'
import { factory } from 'typescript'

export class GodClass {
  constructor (
    private prevText = '',
    private imports: string[] = [],
    private hasReadme = false,
    private hasAction = false,
    private parameters: ts.ObjectLiteralExpression | null = null,
    private template = '',
    private dataMethodReturnValue: ts.ObjectLiteralElementLike | null = null,
    private methods: ts.ObjectLiteralElementLike | null = null,
    private knobVariables: KnobVariables = []
  ) {}

  getAll = () => {
    return {
      imports: this.imports,
      hasReadme: this.hasReadme,
      hasAction: this.hasAction,
      parameters: this.parameters,
      template: this.template,
      dataMethodReturnValue: this.dataMethodReturnValue,
      methods: this.methods,
      knobVariables: this.knobVariables
    }
  }

  addImport = (importText: string) => { this.imports = this.imports.concat(importText) }
  setHasReadme = (hasReadme: boolean) => { this.hasReadme = hasReadme }
  setHasAction = (hasAction: boolean) => { this.hasAction = hasAction }
  setParameters = (parameters: ts.ObjectLiteralExpression) => { this.parameters = parameters }
  setTemplate = (template: string) => { this.template = template }
  setDataMethodReturnValue = (dataMethodReturnValue: ts.ObjectLiteralElementLike) => { this.dataMethodReturnValue = dataMethodReturnValue }
  setMethods = (methods: ts.ObjectLiteralElementLike) => { this.methods = methods }

  // SB コンポーネント名
  isPrevStoriesOf = (text: string) => text === 'Identifier: storiesOf'
  includesStorybook = (text: string) => text.includes('storybook')
  // parameters
  includesInfoOrNotes = (text: string) => text.includes('info') || text.includes('notes')
  // template
  // html タグで始まるか否か
  isVueTemplate = (text: string) => text.substring(1).trim().startsWith('<')
  // data()
  isDataMethod = (text: string) => text.trim().startsWith('data')
  // methods
  isMethods = (text: string) => text.trim().startsWith('methods')
  // knobVariables
  // 関数であることを確かめる
  isSomeCallExpression = (identifier: string, text: string) => text.trim().startsWith(`${identifier}(`)
  // html
  // HTML か否か。add() の第一引数の StoryName で判断する
  isPrevIdentifierAdd = (text: string) => text === 'Identifier: add'
  // knob
  addKnobVariable = (args: any, text: string) => {
    // 初期値に text を入れておく
    let type: keyof typeof KnobFunc | null = null

    if (this.isSomeCallExpression(KnobFunc.text, text)) {
      type = KnobFunc.text
    } else if (this.isSomeCallExpression(KnobFunc.select, text)) {
      type = KnobFunc.select
    } else if (this.isSomeCallExpression(KnobFunc.number, text)) {
      type = KnobFunc.number
    } else if (this.isSomeCallExpression(KnobFunc.boolean, text)) {
      type = KnobFunc.boolean
    } else if (this.isSomeCallExpression(KnobFunc.object, text)) {
      type = KnobFunc.object
    }

    if (type === null) {
      return
    }

    this.knobVariables = this.knobVariables.concat({ type, args })
  }
}

export const KnobFunc = {
  text: 'text',
  select: 'select',
  number: 'number',
  boolean: 'boolean',
  object: 'object'
} as const
export type KnobVariable = {type: keyof typeof KnobFunc, args: any}
export type KnobVariables = KnobVariable[]

export const syntaxKindToName = (kind: ts.SyntaxKind): string => {
  return ts.SyntaxKind[kind]
}

// ------------------------------
// import
// ------------------------------
export const getFilteredImport = (imports: string[], { hasReadme }: { hasReadme: boolean }): string => {
  // filter で不要な import を削除し、
  // concat で必要な import を追加する
  let filtered: string[] = imports
    .filter(item => !item.includes('storiesOf'))
    .filter(item => !item.includes('storybook-addon-vue-info'))

  if (hasReadme) {
    filtered = filtered
      .filter(item => !item.includes('README'))
      .concat('import README from \'./README.md\'')
  }

  return filtered.join('\n')
    .replace('withKnobs,', '')
    .replace("import { withKnobs } from '@storybook/addon-knobs'\n", '') // knob は `preview.js`で読み込むので不要
    .replace('text,', '') // knob の text を削除
    .replace("'../../../CHANGELOG.md'", "'../../CHANGELOG.md'") // knob の text を削除
    .replace("'../../../CONTRIBUTE.md'", "'../../CONTRIBUTE.md'") // knob の text を削除
  // .replace('../../values', '../values') // values の import の階層を浅くする
}

// ------------------------------
// export default
// ------------------------------
export const getExportAssignmentProperties = ({
  title,
  component,
  knobVariables
}: { title: string, component: string, knobVariables: KnobVariables },
{
  hasReadme,
  isHTML
}: { hasReadme: boolean; isHTML: boolean }
) => {
  const properties: ts.ObjectLiteralElementLike[] = [
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier('title'),
      ts.factory.createStringLiteral(title)
    )
  ]

  // Vue の場合だけコンポーネント名を指定する
  if (!isHTML) {
    properties.push(
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier('component'),
        ts.factory.createIdentifier(component)
      )
    )
  }

  if (hasReadme) {
    const parameters = factory.createPropertyAssignment(
      factory.createIdentifier('parameters'),
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            factory.createIdentifier('notes'),
            factory.createObjectLiteralExpression(
              [factory.createShorthandPropertyAssignment(
                factory.createIdentifier('README'),
                undefined
              )],
              false
            )
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('docs'),
            factory.createObjectLiteralExpression(
              [factory.createPropertyAssignment(
                factory.createIdentifier('extractComponentDescription'),
                factory.createParenthesizedExpression(factory.createArrowFunction(
                  undefined,
                  undefined,
                  [
                    factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      undefined,
                      factory.createIdentifier('_'),
                      undefined,
                      undefined,
                      undefined
                    ),
                    factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      undefined,
                      factory.createObjectBindingPattern([factory.createBindingElement(
                        undefined,
                        undefined,
                        factory.createIdentifier('notes'),
                        undefined
                      )]),
                      undefined,
                      undefined,
                      undefined
                    )
                  ],
                  undefined,
                  factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  factory.createPropertyAccessChain(
                    factory.createIdentifier('notes'),
                    factory.createToken(ts.SyntaxKind.QuestionDotToken),
                    factory.createIdentifier('README')
                  )
                ))
              )],
              true
            )
          )
        ],
        true
      )
    )
    properties.push(parameters)
  }

  // knob select
  const selects = knobVariables.filter(item => item.type === KnobFunc.select)

  if (selects.length > 0) {
    const props = selects.map(({ args }) => {
      const isOptionString = !!args[1].text // args[1] が 配列なら false になる
      const options = isOptionString
        ? factory.createIdentifier(args[1].text)
        : args[1]

      return (
        factory.createPropertyAssignment(
          factory.createIdentifier(args[0].text),
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                factory.createIdentifier('options'),
                options
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('control'),
                factory.createObjectLiteralExpression(
                  [factory.createPropertyAssignment(
                    factory.createIdentifier('type'),
                    factory.createStringLiteral('select')
                  )],
                  false
                )
              )
            ],
            true
          )
        ))
    }
    )

    const argTypes = factory.createPropertyAssignment(
      factory.createIdentifier('argTypes'),
      factory.createObjectLiteralExpression(
        props,
        true
      )
    )

    properties.push(argTypes)
  }

  return properties
}

export const createExportAssignmentAst = (node: ts.ObjectLiteralElementLike[]) => factory.createExportAssignment(
  undefined,
  undefined,
  undefined,
  factory.createObjectLiteralExpression(
    node,
    true
  )
)

// const Template = () => {...}
export const createTemplateVariableStatementAst = ({ methods, component, template, isHTML }: { methods: ts.ObjectLiteralElementLike | null; component: string; template: string; isHTML: boolean }) => {
  const getAdditionalPropertiesOfTemplate = ({ methods }: { methods: ts.ObjectLiteralElementLike | null }) => {
    const props = []

    if (methods) {
      props.push(methods)
    }

    return props
  }
  const additionalPropertiesOfTemplate = getAdditionalPropertiesOfTemplate({ methods })

  const properties = [
    factory.createPropertyAssignment(
      factory.createIdentifier('props'),
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier('Object'),
          factory.createIdentifier('keys')
        ),
        undefined,
        [factory.createIdentifier('argTypes')]
      )
    ),
    factory.createPropertyAssignment(
      factory.createIdentifier('template'),
      factory.createNoSubstitutionTemplateLiteral(template)
    ),
    ...additionalPropertiesOfTemplate
  ]

  if (!isHTML) {
    properties.unshift(
      factory.createPropertyAssignment(
        factory.createIdentifier('components'),
        factory.createObjectLiteralExpression(
          [factory.createShorthandPropertyAssignment(
            factory.createIdentifier(component),
            undefined
          )],
          false
        )
      )
    )
  }

  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(
        factory.createIdentifier('Template'),
        undefined,
        undefined,
        factory.createArrowFunction(
          undefined,
          undefined,
          [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              undefined,
              factory.createIdentifier('args'),
              undefined,
              undefined,
              undefined
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              undefined,
              factory.createObjectBindingPattern([factory.createBindingElement(
                undefined,
                undefined,
                factory.createIdentifier('argTypes'),
                undefined
              )]),
              undefined,
              undefined,
              undefined
            )
          ],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createParenthesizedExpression(factory.createObjectLiteralExpression(
            properties,
            true
          ))
        )
      )],
      ts.NodeFlags.Const
    )
  )
}

const customCreatePropertyAssignment = (key: string, value: string, propType: 'string' | 'number' | 'boolean' = 'string') => {
  let propValue = null

  switch (propType) {
    case 'string' :
      propValue = factory.createStringLiteral(value)
      break
    case 'number' :
      propValue = factory.createNumericLiteral(value)
      break
    case 'boolean' :
      propValue = value === 'true' ? factory.createTrue() : factory.createFalse()
      break
    default:
      break
  }

  if (propValue === null) {
    throw new Error('propValue is null')
  }

  return factory.createPropertyAssignment(
    factory.createIdentifier(key),
    propValue
  )
}

// Default.args = {} のオブジェクトのプロパティを作成する
export const getArgsAst = ({
  dataMethodReturnValue,
  knobVariables
}: { dataMethodReturnValue: ts.ObjectLiteralElementLike | null, knobVariables: KnobVariables }) => {
  let args: any = []

  if (dataMethodReturnValue) {
    args = args.concat((dataMethodReturnValue as any).properties)
  }

  // Knob の text, number ,boolean, object で定義された値を args に移動する
  if (knobVariables.length > 0) {
    args = args.concat(
      knobVariables.map(
        ({ type, args }) => {
          const key = args[0].text

          if (type === KnobFunc.text) {
            return customCreatePropertyAssignment(key, args[1].text)
          } else if (type === KnobFunc.number) {
            return customCreatePropertyAssignment(key, args[1].text, 'number')
          } else if (type === KnobFunc.boolean) {
            const value = syntaxKindToName(args[1].kind) === 'TrueKeyword' ? 'true' : 'false'

            return customCreatePropertyAssignment(key, value, 'boolean')
          } else if (type === KnobFunc.object) {
            return factory.createPropertyAssignment(
              factory.createIdentifier(key),
              args[1]
            )
          }

          return false
        }
      ).filter(Boolean)
    )
  }

  args = args.filter((item: any) => !!item)

  const hasArgs = Object.entries(args).length > 0
  const props = hasArgs ? args : []
  const isMultiLine = hasArgs

  return factory.createObjectLiteralExpression(
    props,
    isMultiLine
  )
}
