import { JS_MANAGERS } from '@/enums/managers';
import type { TechCategory } from '@/types';

export const ui_library: TechCategory = {
  id: 'ui_library',
  label: { zh: 'UI组件库', en: 'UI Library' },
  groups: [
    {
      managers: JS_MANAGERS,
      items: [
        { key: 'antd', name: 'Ant Design' },
        { key: '@ant-design/icons', name: 'Ant Design Icons' },
        { key: '@mui/material', name: 'Material UI' },
        { key: '@chakra-ui/react', name: 'Chakra UI' },
        { key: 'element-plus', name: 'Element Plus' },
        { key: 'element-ui', name: 'Element UI' },
        { key: 'vuetify', name: 'Vuetify' },
        { key: 'radix-ui', name: 'Radix UI' },
        { key: '@radix-ui/react-dialog', name: 'Radix UI (Dialog)' },
        { key: 'lucide-react', name: 'Lucide React' },
        { key: '@headlessui/react', name: 'Headless UI' },
        { key: 'daisyui', name: 'daisyUI' },
        { key: 'shadcn-ui', name: 'shadcn/ui' },
      ],
    },
  ],
};
