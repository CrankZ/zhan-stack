import ReactDOM from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { injectContainer, isRepoRoot, waitForReady } from '@/content/logic/injector';
import ContentScriptContainer from '../content/ContentScriptContainer';

export default defineContentScript({
  matches: ['https://github.com/*'],
  runAt: 'document_idle',
  async main(ctx: ContentScriptContext) {
    if (!isRepoRoot()) return;

    await waitForReady(ctx);

    const container = injectContainer();
    if (!container) return;

    const ui = await createShadowRootUi(ctx, {
      name: 'github-tech-stack',
      position: 'inline',
      anchor: container,
      onMount: (rootContainer) => {
        const root = ReactDOM.createRoot(rootContainer);
        root.render(<ContentScriptContainer />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
