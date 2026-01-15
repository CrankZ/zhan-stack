import { getFileTypeInfo } from './packageManagers';

/**
 * 根据包管理器配置文件的路径，返回人类可读的显示名称。
 *
 * @param path 包管理器配置的文件路径。
 * @returns 包管理器的显示名称。
 */
export const getPackageManagerDisplayName = (path: string): string => {
  const info = getFileTypeInfo(path);
  if (info) {
    return info.displayName;
  }
  return path.split('/').pop() || path;
};

/**
 * 为当前仓库中的给定文件路径构建 GitHub blob URL。
 *
 * @param filePath 仓库中文件的相对路径。
 * @returns 文件的完整 GitHub URL。
 */
export const getGitHubFileUrl = (filePath: string): string => {
  const pathParts = window.location.pathname.split('/').filter((part) => part !== '');

  if (pathParts.length >= 4 && (pathParts[2] === 'tree' || pathParts[2] === 'blob')) {
    const owner = pathParts[0];
    const repo = pathParts[1];
    const branch = pathParts[3];
    if (branch && branch.length > 0 && branch !== 'Branches' && !branch.includes(' ')) {
      return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
    }
  }

  if (pathParts.length >= 2) {
    const owner = pathParts[0];
    const repo = pathParts[1];
    let branch = 'main';

    const url = new URL(window.location.href);
    const pathnameParts = url.pathname.split('/');
    if (pathnameParts.length >= 4 && (pathnameParts[2] === 'tree' || pathnameParts[2] === 'blob')) {
      const potentialBranch = pathnameParts[3] || branch;
      if (
        potentialBranch &&
        potentialBranch.length > 0 &&
        potentialBranch !== 'Branches' &&
        !potentialBranch.includes(' ')
      ) {
        branch = potentialBranch;
      }
    }

    const branchSelectors = [
      '.repository-content .BtnGroup a[href*="/tree/"]',
      '.file-navigation .btn[href*="/tree/"]',
      '[data-menu-button-text]',
      '.dropdown-menu a[href*="/tree/"]',
      '.react-directory-filename-column a[href*="/tree/"]',
      '.octicon-git-branch ~ span',
    ];
    for (const selector of branchSelectors) {
      const branchElement = document.querySelector(selector);
      if (branchElement) {
        if (selector.includes('octicon-git-branch')) {
          const potentialBranch = branchElement.textContent?.trim() || '';
          if (
            potentialBranch &&
            potentialBranch.length > 0 &&
            potentialBranch !== 'Branches' &&
            !potentialBranch.includes(' ')
          ) {
            branch = potentialBranch;
            break;
          }
        }
      }
    }

    return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
  }

  return `https://github.com/${pathParts[0]}/${pathParts[1]}/blob/main/${filePath}`;
};
