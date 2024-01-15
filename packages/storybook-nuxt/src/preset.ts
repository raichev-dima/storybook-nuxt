import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import type { PresetProperty } from '@storybook/types'
import { type UserConfig as ViteConfig, mergeConfig, searchForWorkspaceRoot } from 'vite'
import type { Nuxt } from '@nuxt/schema'
import vuePlugin from '@vitejs/plugin-vue'

import replace from '@rollup/plugin-replace'
import type { StorybookConfig } from './types'
import { pluginsDir } from './dirs'

const packageDir = resolve(fileURLToPath(
  import.meta.url), '../..')
const distDir = resolve(fileURLToPath(
  import.meta.url), '../..', 'dist')
const runtimeDir = resolve(distDir, 'runtime')

const componentsDir = resolve(runtimeDir, 'components')
const composablesDir = resolve(runtimeDir, 'composables')

const dirs = [distDir, packageDir, componentsDir, composablesDir, runtimeDir]

let nuxt: Nuxt

/**
 * extend nuxt-link component to use storybook router
 * @param nuxt
 */
function extendComponents(nuxt: Nuxt) {
  nuxt.hook('components:extend', (components: any) => {
    const nuxtLink = components.find(({ name }: any) => name === 'NuxtLink')
    nuxtLink.filePath = join(runtimeDir, 'components/nuxt-link')
    nuxtLink.shortPath = join(runtimeDir, 'components/nuxt-link')
    nuxt.options.build.transpile.push(nuxtLink.filePath)
  })
}

/**
 * extend composables to override router ( fix undefined router  useNuxtApp )
 *
 * @param nuxt
 * */

async function extendComposables(nuxt: Nuxt) {
  const { addImportsSources } = await import('@nuxt/kit')
  nuxt.options.build.transpile.push(composablesDir)
  addImportsSources({ imports: ['useRouter'], from: join(composablesDir, 'router') })
}

async function defineNuxtConfig(baseConfig: Record<string, any>) {
  const { loadNuxt, buildNuxt, addPlugin, extendPages } = await import('@nuxt/kit')

  nuxt = await loadNuxt({
    rootDir: baseConfig.root,
    ready: false,
    dev: false,

    overrides: {
      ssr: false,
    },
  })

  if ((nuxt.options.builder as string) !== '@nuxt/vite-builder')
    throw new Error(`Storybook-Nuxt does not support '${nuxt.options.builder}' for now.`)

  let extendedConfig: ViteConfig = {}
  nuxt.options.build.transpile.push(join(packageDir, 'preview'))
  nuxt.options.build.transpile.push('@storybook-vue/nuxt')

  nuxt.hook('modules:done', () => {
    extendComposables(nuxt)
    // Override nuxt-link component to use storybook router
    extendComponents(nuxt)
    addPlugin({
      src: join(pluginsDir, 'storybook'),
      mode: 'client',
    })
    // Add iframe page
    extendPages((pages: any) => {
      pages.push({
        name: 'storybook-iframe',
        path: '/iframe.html',
      })
    })

    nuxt.hook(
      'vite:extendConfig',
      (
        config: ViteConfig | PromiseLike<ViteConfig> | Record<string, any>,
        { isClient }: any,
      ): void => {
        if (isClient) {
          const plugins = baseConfig.plugins

          // Find the index of the plugin with name 'vite:vue'
          const index = plugins.findIndex((plugin: any) => plugin.name === 'vite:vue')

          // Check if the plugin was found
          if (index !== -1) {
            // Replace the plugin with the new one using vuePlugin()
            plugins[index] = vuePlugin()
          }
          else {
            // Handle the case where the plugin with name 'vite:vue' was not found
            console.error('Plugin \'vite:vue\' not found in the array.')
          }
          baseConfig.plugins = plugins
          extendedConfig = mergeConfig(config, baseConfig)
        }
      },
    )
  })

  await nuxt.ready()

  try {
    await buildNuxt(nuxt)

    nuxt.options.dev = true

    return {
      viteConfig: extendedConfig,
      nuxt,
    }
  }
  catch (e: any) {
    throw new Error(e)
  }
}
export const core: PresetProperty<'core', StorybookConfig> = async (config: any) => {
  return ({
    ...config,
    builder: '@storybook/builder-vite',
    renderer: '@storybook/vue3',
  })
}
/**
 *
 * @param entry preview entries
 * @returns preview entries with nuxt runtime
 */
export const previewAnnotations: StorybookConfig['previewAnnotations'] = async (entry = []) => {
  return [...entry, resolve(packageDir, 'preview')]
}

export const viteFinal: StorybookConfig['viteFinal'] = async (
  config: Record<string, any>,
  options: any,
) => {
  const getStorybookViteConfig = async (c: Record<string, any>, o: any) => {
    // const pkgPath = await getPackageDir('@storybook/vue3-vite')
    const presetURL = pathToFileURL(join(await getPackageDir('@storybook/vue3-vite'), 'preset.js'))
    const { viteFinal: ViteFile } = await import(presetURL.href)

    if (!ViteFile)
      throw new Error('ViteFile not found')
    return ViteFile(c, o)
  }
  const nuxtConfig = await defineNuxtConfig(await getStorybookViteConfig(config, options))

  return mergeConfig(nuxtConfig.viteConfig, {
    // build: { rollupOptions: { external: ['vue', 'vue-demi'] } },
    define: {
      '__NUXT__': JSON.stringify({ config: nuxtConfig.nuxt.options.runtimeConfig }),
      'import.meta.client': 'true',
    },

    plugins: [replace({
      values: {
        'import.meta.server': 'false',
        'import.meta.client': 'true',
      },
      preventAssignment: true,
    })],
    server: {
      fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...dirs] },
    },
    envPrefix: ['NUXT_'],
  })
}

async function getPackageDir(frameworkPackageName: any) {
  //   const packageJsonPath = join(frameworkPackageName, 'package.json')

  try {
    const require = createRequire(import.meta.url)
    const packageDir = dirname(require.resolve(join(frameworkPackageName, 'package.json'), { paths: [process.cwd()] }))

    return packageDir
  }
  catch (e) {
    // logger.error(e)
  }
  throw new Error(`Cannot find ${frameworkPackageName},`)
}
