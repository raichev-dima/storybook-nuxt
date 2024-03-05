import type { StoryContext } from '@storybook/vue3'
import { applyPlugins, createNuxtApp } from 'nuxt/app'
import { getContext } from 'unctx'

import type { App as VueApp } from 'vue'
import { nextTick } from 'vue'

export async function setupNuxtApp(vueApp: VueApp, storyContext?: StoryContext) {
  async function initApp() {
    const nuxt = createNuxtApp({ vueApp, globalName: `nuxt-${storyContext?.id || ''}` })

    getContext('nuxt-app').set(nuxt, true)
    try {
      // @ts-expect-error virtual file
      await import('#build/paths.mjs')
      // @ts-expect-error virtual file
      await import('#build/fetch.mjs')
      // @ts-expect-error virtual file
      const plugins = await import ('#build/plugins')
      await applyPlugins(nuxt, plugins.default)
    }
    catch (err: any) {
      await nuxt.callHook('app:error', err)
      nuxt.payload.error = nuxt.payload.error || err
    }
    try {
      await nuxt.hooks.callHook('app:created', vueApp)
      await nuxt.hooks.callHook('app:beforeMount', vueApp)
      await nuxt.hooks.callHook('app:mounted', vueApp)
      await nextTick()
    }
    catch (err: any) {
      await nuxt.callHook('app:error', err)
      nuxt.payload.error = nuxt.payload.error || err
    }
    return vueApp
  }

  return initApp().catch((error) => {
    console.error('Error while mounting app:', error)
  })
}
