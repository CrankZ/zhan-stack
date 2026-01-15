import { SWIFT_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const network: TechCategory = {
  id: 'network',
  label: { zh: '网络', en: 'Network' },
  groups: [
    {
      managers: SWIFT_MANAGERS,
      items: [
        { key: 'Alamofire', name: 'Alamofire' },
        { key: 'Moya', name: 'Moya' },
      ],
    },
  ],
};
