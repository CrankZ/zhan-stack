import { DOTNET_MANAGERS, JAVA_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const orm: TechCategory = {
  id: 'orm',
  label: { zh: 'ORM', en: 'ORM' },
  groups: [
    {
      managers: JAVA_MANAGERS,
      items: [{ key: 'hibernate-core', name: 'Hibernate' }],
    },
    {
      managers: DOTNET_MANAGERS,
      items: [{ key: 'EntityFramework', name: 'Entity Framework' }],
    },
  ],
};
