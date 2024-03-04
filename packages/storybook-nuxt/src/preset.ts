import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Nuxt } from '@nuxt/schema'

import replace from '@rollup/plugin-replace'
import type { PresetProperty } from '@storybook/types'
import { type UserConfig as ViteConfig, mergeConfig, searchForWorkspaceRoot } from 'vite'
import type { StorybookConfig } from './types'
import { dirs, packageDir } from './dirs'

let nuxt: Nuxt

async function defineNuxtConfig(baseConfig: Record<string, any>) {
  const { loadNuxt, buildNuxt, extendPages } = await import('@nuxt/kit')

  nuxt = await loadNuxt({
    ready: false,
    dev: true,

    overrides: {
      ssr: false,
      typescript: {
        typeCheck: false,
      },
    },
  })

  if ((nuxt.options.builder as string) !== '@nuxt/vite-builder')
    throw new Error(`Storybook-Nuxt does not support '${nuxt.options.builder}' for now.`)

  let extendedConfig: ViteConfig = {}

  nuxt.hook('modules:done', () => {
    // Add iframe page
    extendPages((pages: any) => {
      pages.push({
        name: 'storybook-iframe',
        path: '/iframe.html',
        alias: ['/iframe.html'],
      })
    })

    nuxt.hook(
      'vite:configResolved',
      (
        config: ViteConfig | PromiseLike<ViteConfig> | Record<string, any>,
        { isClient }: any,
      ) => {
        if (isClient) {
          baseConfig.plugins = baseConfig.plugins.filter((plugin: any) => plugin.name !== 'vite:vue')
          extendedConfig = mergeConfig(config, baseConfig)
        }
      },
    )
  })

  await nuxt.ready()

  try {
    await buildNuxt(nuxt)

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
    return dirname(require.resolve(join(frameworkPackageName, 'package.json'), { paths: [process.cwd()] }))
  }
  catch (e) {
    // logger.error(e)
  }
  throw new Error(`Cannot find ${frameworkPackageName},`)
}
