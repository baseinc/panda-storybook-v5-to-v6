# Storybook v5 to v6

Storybook component converter from v5 to v6. This script converts Storybook component written by `stories` function to [CSF (Component Story Format)](https://storybook.js.org/docs/react/api/csf).

Since this program is specific to BBQ (UI Library for BASE.inc), you have to custom some part of "index.ts" or "modules.ts" in more general use.

The command below generates "example/v6.js" using "example/v5.js".

```shell
$ yarn run convert ./example/v5.js ./example/v6.js
```

```js
// example/v5.js
import { action } from '@storybook/addon-actions'
import { number, select, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/vue'
import { withInfo } from 'storybook-addon-vue-info'

import { ButtonGroup } from '../../elements/buttonGroup/button-group.vue'
import README from '../../elements/buttonGroup/README.md'
import { devices } from '../../values/Devices'

// Storybook コンポーネント名
const buttonStories = storiesOf('Elements/ButtonGroup', module)

buttonStories
  // addon-knob
  .addDecorator(withKnobs)
  // addon-info
  .addDecorator(withInfo)
  .add(
    'ButtonGroup',
    () => {
      return {
        components: { ButtonGroup },
        // Vue Template
        template: `
          <div :class="'theme-'+device">
            <p>
              <h2>デフォルト</h2>
              <div>アイコン+ラベル</div>
              <bbq-button-group :tag="tag" :items="iconsAndLabels" @change="({index}) => {this.selected = index; change(index)}" :selected="selected" :width="width"/>
              <div>アイコン</div>
              <bbq-button-group :tag="tag" :items="icons" @change="({index}) => {this.selected = index; change(index)}" :selected="selected" :width="width"/>
              <div>ラベル</div>
              <bbq-button-group :tag="tag" :items="labels" @change="({index}) => {this.selected = index; change(index)}" :selected="selected" :width="width"/>
            </p>
            <p>
              <h2>カスタムUI</h2>
              <bbq-button-group :tag="tag" :items="['a','b', 'c', 'd']" @change="({index}) => change(index)" :selected="selected" :width="width">
                <template v-slot="{items, change}">
                  <button v-for="(item, index) in items" @click="change(index)">
                    {{item}}: {{index}}
                  </button>
                </template>
              </bbq-button-group>
            </p>
          </div>
        `,
        // Data
        data() {
          return {
            device: select(`device`, devices, 'pc'),
            selected: number('selected', 0),
            width: select('width', ['', 'full']),
          }
        },
        // Props
        props: {
          tag: { default: text('tag', 'ul') },
        },
        // Computed
        computed: {
          icons() {
            return [{ icon: 'list' }, { icon: 'grid' }]
          },
          labels() {
            return [{ label: 'ドラッグで並び替え' }, { label: '数値で並び替え' }]
          },
          iconsAndLabels() {
            return [
              { icon: 'list', label: 'リストで並び替え' },
              { icon: 'grid', label: 'グリッドで並び替え' },
              { icon: 'attentionCircle', label: '念で並び替え' },
            ]
          },
        },
        // methods
        methods: {
          change: action('change'),
        },
      }
    },
    // Parameters
    {
      notes: README,
    }
  )
```

```js
// example/v6.js
import { action } from '@storybook/addon-actions'
import { number, select,  withKnobs } from '@storybook/addon-knobs'
import { ButtonGroup } from '../../elements/buttonGroup/button-group.vue'
import { devices } from '../../values/Devices'
import README from './README.md'

export default {
    title: "V6/Elements/ButtonGroup",
    component: ButtonGroup,
    parameters: {
        notes: { README },
        docs: {
            extractComponentDescription: ((_, { notes }) => notes?.README)
        }
    },
    argTypes: {
        device: {
            options: devices,
            control: { type: "select" }
        },
        width: {
            options: ["", "full"],
            control: { type: "select" }
        }
    }
};

const Template = (args, { argTypes }) => ({
    components: { ButtonGroup },
    props: Object.keys(argTypes),
    template: `
          <div :class="'theme-'+device">
            <p>
              <h2>デフォルト</h2>
              <div>アイコン+ラベル</div>
              <bbq-button-group :tag="tag" :items="iconsAndLabels" @change="({index}) => {this.selected = index; change(index)}" :selected="selected" :width="width"/>
              <div>アイコン</div>
              <bbq-button-group :tag="tag" :items="icons" @change="({index}) => {this.selected = index; change(index)}" :selected="selected" :width="width"/>
              <div>ラベル</div>
              <bbq-button-group :tag="tag" :items="labels" @change="({index}) => {this.selected = index; change(index)}" :selected="selected" :width="width"/>
            </p>
            <p>
              <h2>カスタムUI</h2>
              <bbq-button-group :tag="tag" :items="['a','b', 'c', 'd']" @change="({index}) => change(index)" :selected="selected" :width="width">
                <template v-slot="{items, change}">
                  <button v-for="(item, index) in items" @click="change(index)">
                    {{item}}: {{index}}
                  </button>
                </template>
              </bbq-button-group>
            </p>
          </div>
        `,
    methods: {
        change: action("change"),
    }
});

export const Default = Template.bind({})
Default.args = {
    device: select(`device`, devices, "pc"), selected: 0, width: select("width", ["", "full"]),
    selected: 0,
    tag: "ul"
};
```
