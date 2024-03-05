import { createUnplugin } from 'unplugin'

const PLUGIN_NAME = 'storybook-vue:nuxt-runtime-config'

interface NuxtRuntimeConfigPluginOptions {
  content: string
}

const STUB_ID = 'nuxt-storybook-vue-runtime-config.json'

const NuxtRuntimeConfig = createUnplugin((options: NuxtRuntimeConfigPluginOptions) => {
  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    vite: {
      async resolveId(id) {
        if (id === STUB_ID)
          return id
      },
      async load(id) {
        if (id === STUB_ID)
          return options.content
      },
    },
  }
})

export default NuxtRuntimeConfig
