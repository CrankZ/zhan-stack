import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const data_fetching: TechCategory = {
  id: 'data_fetching',
  label: { zh: '数据获取', en: 'Data Fetching' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'axios', name: 'Axios' },
        { key: '@tanstack/react-query', name: 'React Query' },
        { key: 'swr', name: 'SWR' },
      ],
    },
  ],
};
