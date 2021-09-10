// bbq/stories/elements/button-group.stories.js

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
