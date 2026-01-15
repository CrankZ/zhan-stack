import { defineBackground } from 'wxt/utils/define-background';
import { initializeBackground } from '@/background/Background';

export default defineBackground({
  type: 'module',
  main() {
    initializeBackground();
  },
});
