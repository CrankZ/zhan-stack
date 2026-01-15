import { RUST_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const async_runtime: TechCategory = {
  id: 'async_runtime',
  label: { zh: '异步运行时', en: 'Async Runtime' },
  groups: [
    {
      managers: RUST_MANAGERS,
      items: [{ key: 'tokio', name: 'Tokio' }],
    },
  ],
};
