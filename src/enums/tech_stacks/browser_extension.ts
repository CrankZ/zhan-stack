import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const browser_extension: TechCategory = {
  id: 'browser_extension',
  label: { zh: '浏览器插件', en: 'Browser Extension' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'wxt', name: 'WXT' },
        { key: 'plasmo', name: 'Plasmo' },
        { key: '@crxjs/vite-plugin', name: 'CRXJS' },
        { key: 'webext-bridge', name: 'WebExt Bridge' },
      ],
    },
  ],
};
