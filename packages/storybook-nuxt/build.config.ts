import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: [
    { input: 'src/index' },
    { input: 'src/preview' },
    { input: 'src/preset', outDir: 'dist/', format: 'cjs', ext: 'js' },
    { input: 'src/runtime/', outDir: 'dist/runtime', format: 'esm', ext: 'js' },
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  dependencies: [
    'nuxt',
    'vite',
    '@storybook/vue3',
    '@storybook/builder-vite',
    '@storybook/vue3-vite',
  ],
  externals: [
    'nuxt/schema',
    'nuxt/app',
    'vite',
    '@storybook/types',
    '@storybook/vue3',
    '#build/paths.mjs',
    '#build/fetch.mjs',
    '#build/plugins',
    'unctx',
  ],
  failOnWarn: true,
})
