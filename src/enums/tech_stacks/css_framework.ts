import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const css_framework: TechCategory = {
  id: 'css_framework',
  label: { zh: 'CSS框架', en: 'CSS Framework' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [{ key: 'tailwindcss', name: 'Tailwind CSS' }],
    },
  ],
};
