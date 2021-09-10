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

