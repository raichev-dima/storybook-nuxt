import type { BuilderOptions, StorybookConfig as StorybookConfigBase } from '@storybook/types';



declare let STORYBOOK_VUE_GLOBAL_PLUGINS: string[];
declare let STORYBOOK_VUE_GLOBAL_MIXINS: string[];

type FrameworkName = '@storybook-vue/nuxt';
type BuilderName = '@storybook/builder-vite';

export type FrameworkOptions = NuxtOptions & {
  builder?: BuilderOptions;
};

type StorybookConfigFramework = {
  framework: FrameworkName | { name: FrameworkName; options: FrameworkOptions }
  core?: StorybookConfigBase['core'] & { builder?: BuilderName }
  typescript?: StorybookConfigBase['typescript'];
  previewAnnotations?: StorybookConfigBase['previewAnnotations'];
  stories?: StorybookConfigBase['stories'];
  addons?: StorybookConfigBase['addons'];
  docs?: StorybookConfigBase['docs'];
};
/**
 * The interface for Storybook configuration in `main.ts` files.
 */
export type StorybookConfig = { viteFinal?:Record<string, any> } & StorybookConfigFramework;
export interface NuxtOptions {
}

