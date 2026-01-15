import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const build_tool: TechCategory = {
  id: 'build_tool',
  label: { zh: '构建工具', en: 'Build Tool' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'webpack', name: 'Webpack' },
        { key: 'vite', name: 'Vite' },
        { key: 'rollup', name: 'Rollup' },
        { key: 'esbuild', name: 'esbuild' },
        { key: 'parcel', name: 'Parcel' },
        { key: 'gulp', name: 'Gulp' },
        { key: 'turbopack', name: 'Turbopack' },
      ],
    },
  ],
};
