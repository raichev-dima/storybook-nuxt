import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: [
    { input: 'src/index' },
    { input: 'src/preset', outDir: 'dist/', format: 'cjs', ext: 'js' },
    { input: 'src/preview', outDir: 'dist/', format: 'esm', ext: 'js' },
    {
      input: 'src/runtime/', outDir: 'dist/runtime', format: 'esm', ext: 'js',
    },

  ],

  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  dependencies: [
    'vue-router',
    'vue',
  ],
  externals: [
    'nuxt',
    'nuxt/schema',
    'nuxt/app',
    '@storybook/types',
    '@storybook/vue3',
    '@vue/shared',
    '@unhead/vue',
    '@nuxt/devtools-kit',
    'nuxt/build',
  ],
  failOnWarn: false,
})
