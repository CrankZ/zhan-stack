import type { ContentScriptContext } from 'wxt/utils/content-script-context';

/**
 * 处理将 UI 容器注入 GitHub 侧边栏或页眉的逻辑。
 */
const ROOT_ID = 'github-tech-stack-root';

/**
 * 检查当前页面是否为仓库根目录。
 */
export function isRepoRoot(): boolean {
  const pathParts = window.location.pathname.split('/').filter((part) => part !== '');
  const reserved = new Set([
    'orgs',
    'topics',
    'collections',
    'sponsors',
    'explore',
    'enterprise',
    'settings',
    'marketplace',
  ]);

  return (
    window.location.hostname === 'github.com' &&
    pathParts.length === 2 &&
    !reserved.has(pathParts[0])
  );
}

/**
 * 等待文档加载就绪。
 * @param ctx WXT 的内容脚本上下文
 */
export async function waitForReady(ctx: ContentScriptContext): Promise<void> {
  const ready = () => document.readyState === 'complete' || document.readyState === 'interactive';
  if (!ready()) {
    await new Promise<void>((resolve) => {
      ctx.addEventListener(document, 'DOMContentLoaded', () => resolve());
    });
  }
}

/**
 * 将容器注入 GitHub UI。
 * @returns 创建的容器元素，如果注入失败或已存在则返回 null。
 */
export function injectContainer(): HTMLElement | null {
  if (document.getElementById(ROOT_ID)) return null;

  const container = document.createElement('div');
  container.id = ROOT_ID;

  const sidebarContainer =
    document.querySelector('.Layout-sidebar') ||
    document.querySelector('.repository-content .gutter-condensed') ||
    document.querySelector('.Layout .Layout-sidebar') ||
    document.querySelector('[data-pjax="#repo-content-pjax-container"] .gutter-condensed') ||
    document.querySelector('.application-main .Layout-sidebar');

  const aboutGrid = sidebarContainer
    ? (sidebarContainer.querySelector('.BorderGrid.about-margin') as HTMLElement | null)
    : null;

  if (sidebarContainer && aboutGrid) {
    const gridRow = document.createElement('div');
    gridRow.classList.add('BorderGrid-row');
    const gridCell = document.createElement('div');
    gridCell.classList.add('BorderGrid-cell');
    gridCell.appendChild(container);
    gridRow.appendChild(gridCell);
    const firstRow = aboutGrid.querySelector('.BorderGrid-row');
    if (firstRow) {
      aboutGrid.insertBefore(gridRow, firstRow);
    } else {
      aboutGrid.appendChild(gridRow);
    }
  } else if (sidebarContainer) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('about-margin');
    wrapper.style.marginTop = '16px';
    wrapper.appendChild(container);
    sidebarContainer.insertBefore(wrapper, sidebarContainer.firstChild);
  } else {
    const repoHeader =
      document.querySelector('div.repohead h1') ||
      document.querySelector('h1[data-pjax="#js-repo-pjax-container"]') ||
      document.querySelector('main h1') ||
      document.querySelector('h1[data-pjax="#repo-content-pjax-container"]') ||
      document.querySelector('[data-pjax="#repo-content-pjax-container"] h1');

    const wrapper = document.createElement('div');
    wrapper.classList.add('about-margin');
    wrapper.style.marginTop = '16px';
    wrapper.appendChild(container);

    if (repoHeader?.parentNode) {
      repoHeader.parentNode.insertBefore(wrapper, repoHeader.nextSibling);
    } else {
      document.body.appendChild(wrapper);
    }
  }

  return container;
}
