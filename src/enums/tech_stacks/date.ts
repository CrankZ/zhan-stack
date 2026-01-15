import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const date: TechCategory = {
  id: 'date',
  label: { zh: '日期处理', en: 'Date Processing' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'dayjs', name: 'Day.js' },
        { key: 'moment', name: 'Moment.js' },
        { key: 'date-fns', name: 'date-fns' },
        { key: 'luxon', name: 'Luxon' },
      ],
    },
  ],
};
