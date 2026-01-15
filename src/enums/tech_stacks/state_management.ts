import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const state_management: TechCategory = {
  id: 'state_management',
  label: { zh: '状态管理', en: 'State Management' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'redux', name: 'Redux' },
        { key: '@reduxjs/toolkit', name: 'Redux Toolkit' },
        { key: 'mobx', name: 'MobX' },
        { key: 'zustand', name: 'Zustand' },
        { key: 'jotai', name: 'Jotai' },
        { key: 'recoil', name: 'Recoil' },
        { key: 'pinia', name: 'Pinia' },
      ],
    },
  ],
};
