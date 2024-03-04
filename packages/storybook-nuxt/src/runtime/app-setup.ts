import type { App } from 'h3'
import { createApp } from 'h3'
import { applyPlugins, createNuxtApp } from 'nuxt/app'

import { createFetch } from 'ofetch'
import type { App as VueApp } from 'vue'
import { nextTick } from 'vue'

export async function setupNuxtApp(vueApp: VueApp) {
  const win = window as unknown as Window & {
    __app: App
    __registry: Set<string>
    __NUXT__: any
    $fetch: any
    fetch: any
    IntersectionObserver: any
    Headers: any
  }

  win.__NUXT__ = {
    serverRendered: false,
    config: {
      public: {},
      app: { baseURL: '/' },
    },
    data: {},
    state: {},
  }

  win.IntersectionObserver
        = win.IntersectionObserver
        || class IntersectionObserver {
          observe() {
            // noop
          }
        }

  const h3App = createApp()

  const registry = new Set<string>()

  win.$fetch = createFetch({ fetch: win.fetch, Headers: win.Headers as any })

  win.__registry = registry
  win.__app = h3App

  async function initApp() {
    const nuxt = createNuxtApp({ vueApp })
    try {
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
