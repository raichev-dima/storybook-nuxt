import type { Meta, StoryObj } from '@storybook/vue3'

import MyPre from '~/components/Pre.vue'
import MyButton from '~/components/MyButton.vue'

// More on how to set up stories at: https://storybook.js.org/docs/vue/writing-stories/introduction

const meta = {
  title: 'Components/NuxtLink ',
  component: MyButton,
  // This component will have an automatically generated docsPage entry: https://storybook.js.org/docs/vue/writing-docs/autodocs
  tags: ['autodocs'],

} satisfies Meta<typeof MyButton>

export default meta
type Story = StoryObj<typeof meta>
/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/vue/api/csf
 * to learn how to use render functions.
 */

export const Primary: Story = {
  args: { label: 'Primary' },
}

export const PreLink: Story = {
  args: { label: 'My Story' },
  render: () => ({
    components: { MyPre },
    template: '<my-pre> Hello</my-pre>',
  }),
}
