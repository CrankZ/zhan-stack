import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  webExt: {
    disabled: false,
    openDevtools: true,
    openConsole: false,
    startUrls: ['https://github.com/'],
  },
  manifest: {
    name: '栈查查',
    description: '分析并展示 GitHub 仓库的技术栈',
    permissions: ['storage'],
    host_permissions: ['https://github.com/*', 'https://raw.githubusercontent.com/*'],
    action: {
      default_title: '栈查查',
    },
  },
  hooks: {
    'build:publicAssets': (wxt, assets) => {
      void wxt;
      assets.push({
        relativeDest: 'icons/icon.png',
        absoluteSrc: `${process.cwd().replace(/\\/g, '/')}/src/icons/icon.png`,
      });
    },
    'build:manifestGenerated': (wxt, manifest) => {
      void wxt;
      manifest.icons = {
        16: 'icons/icon.png',
        32: 'icons/icon.png',
        48: 'icons/icon.png',
        128: 'icons/icon.png',
      };
    },
  },
});
