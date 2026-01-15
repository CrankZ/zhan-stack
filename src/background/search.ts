import { packageManager } from '@/enums/packageManager';
import type { LanguageType, PackageData, PackageManagerType } from '@/types';
import { getFileTypeInfo } from '@/utils/packageManagers';
import { shouldSkipPath } from '@/utils/path';
import { parsePackageFile } from './parsers';

/**
 * 扫描 GitHub 仓库中所有相关的包管理文件。
 * 使用 GitHub Web 界面（非 API）检索文件树。
 *
 * @param owner 仓库所有者
 * @param repo 仓库名称
 * @returns 返回一个包含找到的文件和元数据对象的承诺
 */
export async function searchAllPackageFiles(
  owner: string,
  repo: string,
): Promise<{
  files: {
    path: string;
    data: PackageData;
    language: LanguageType;
    packageManager: PackageManagerType;
  }[];
  meta: any;
}> {
  const TIMEOUT_MS = 10000;

  const fetchWithTimeout = async (url: string): Promise<Response | null> => {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(url, { signal: ac.signal });
      if (r.ok) return r;
    } catch (e) {
      console.warn(`Fetch failed for ${url}:`, e);
    } finally {
      clearTimeout(id);
    }
    return null;
  };

  // 通过 Web 接口（非 API）获取文件树
  const getTreeViaWeb = async (owner: string, repo: string, branch: string) => {
    console.log(`[getTreeViaWeb] 开始尝试获取仓库文件树: ${owner}/${repo}, 分支: ${branch}`);
    const encodedBranch = encodeURIComponent(branch);
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `https://github.com/${owner}/${repo}`,
    };

    // 尝试获取 SHA 的辅助函数
    const extractSha = (html: string) => {
      const patterns = [
        /"commitOID":"([a-f0-9]+)"/,
        /"currentOid":"([a-f0-9]+)"/,
        /"oid":"([a-f0-9]+)"/,
        /"current_tree_oid":"([a-f0-9]+)"/,
        /href="\/[^/]+\/[^/]+\/commit\/([a-f0-9]{40})"/,
        /"refName":"([^"]+)"/, // 有时 refName 后面跟着 SHA
      ];
      for (const p of patterns) {
        const match = html.match(p);
        if (match?.[1] && match[1].length >= 40) {
          console.log(`[getTreeViaWeb] 成功提取 SHA: ${match[1]} (匹配模式: ${p.toString()})`);
          return match[1];
        }
      }
      return null;
    };

    let bestTree: { path: string }[] | null = null;
    let isBestRecursive = false;
    let searchMethod = 'none';

    const updateBestTree = (newTree: { path: string }[] | null, method: string) => {
      if (!newTree || newTree.length === 0) return;

      const isRecursive = newTree.some((item: { path: string }) => item.path?.includes('/'));

      // 优先级：递归树 > 非递归树；同类型比大小
      let shouldUpdate = false;
      if (bestTree === null) {
        shouldUpdate = true;
      } else {
        if (isRecursive && !isBestRecursive) {
          shouldUpdate = true;
        } else if (isRecursive === isBestRecursive) {
          if (newTree.length > bestTree.length) {
            shouldUpdate = true;
          }
        }
      }

      if (shouldUpdate) {
        bestTree = newTree;
        isBestRecursive = isRecursive;
        searchMethod = method;
        console.log(
          `[getTreeViaWeb] 更新最佳文件树: 来源=${method}, 规模=${newTree.length}, 是否递归=${isRecursive}`,
        );
      }
    };

    // 1. 获取 HTML 以提取 SHA
    let sha = '';
    const treeUrl = `https://github.com/${owner}/${repo}/tree/${encodedBranch}`;
    try {
      console.log(`[getTreeViaWeb] 步骤 1: 尝试从 HTML 提取 SHA: ${treeUrl}`);
      const htmlResp = await fetch(treeUrl, {
        headers: { ...headers, 'Accept': 'text/html', 'X-Requested-With': undefined as any },
      });
      if (htmlResp.ok) {
        const html = await htmlResp.text();
        sha = extractSha(html) || '';

        const dataMatch = html.match(
          /<script type="application\/json" data-target="react-app.embeddedData">(.*?)<\/script>/,
        );
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);
            const payload = data?.payload;
            if (!sha && payload?.commitOID) sha = payload.commitOID;
          } catch (_e) {}
        }
      }
    } catch (_e) {}

    // 如果还没有拿到 SHA，尝试从 commits 页面拿
    if (!sha) {
      try {
        const commitsUrl = `https://github.com/${owner}/${repo}/commits/${encodedBranch}`;
        console.log(`[getTreeViaWeb] 步骤 1.5: 尝试从 Commits 页面提取 SHA: ${commitsUrl}`);
        const commitsResp = await fetch(commitsUrl, {
          headers: { ...headers, 'Accept': 'text/html', 'X-Requested-With': undefined as any },
        });
        if (commitsResp.ok) {
          const html = await commitsResp.text();
          sha = extractSha(html) || '';
        }
      } catch (_e) {}
    }

    // 2. 核心尝试: tree-list/${sha} (最可靠的全量递归接口)
    if (sha) {
      try {
        const url = `https://github.com/${owner}/${repo}/tree-list/${sha}`;
        console.log(`[getTreeViaWeb] 步骤 2: 尝试 tree-list 接口 (基于 SHA): ${url}`);
        const resp = await fetch(url, { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.paths)) {
            const tree = data.paths.map((p: string) => ({ path: p }));
            updateBestTree(tree, 'GitHub_TreeList_SHA');
            if (isBestRecursive && bestTree)
              return { tree: bestTree as { path: string }[], method: searchMethod };
          }
        }
      } catch (_e) {}
    }

    // 3. 最后的兜底: 仅获取根目录 (tree 接口)
    try {
      const url = `https://github.com/${owner}/${repo}/tree/${encodedBranch}`;
      console.log(`[getTreeViaWeb] 步骤 3: 尝试 tree 接口 (兜底): ${url}`);
      const resp = await fetch(url, { headers: { ...headers, 'Accept': 'application/json' } });
      if (resp.ok) {
        const data = await resp.json();
        const payload = data.payload;
        const items =
          payload?.tree?.items ||
          (payload?.fileTree
            ? Object.values(payload.fileTree).flatMap((dir: any) => (dir as any).items)
            : []);
        if (Array.isArray(items) && items.length > 0) {
          updateBestTree(
            items.map((i: any) => ({ path: i.path })),
            'GitHub_Tree_RootOnly',
          );
        }
      }
    } catch (_e) {}

    return bestTree ? { tree: bestTree, method: searchMethod } : null;
  };

  const fetchPackageResponse = async (
    ownerId: string,
    repoId: string,
    branch: string,
    fullPath: string,
  ): Promise<Response | null> => {
    const rawUrl = `https://raw.githubusercontent.com/${ownerId}/${repoId}/${branch}/${fullPath}`;
    return await fetchWithTimeout(rawUrl);
  };

  const branches = ['main', 'master', 'dev', 'develop'];

  // 1. 尝试获取全量文件树（这是最理想的情况，能支持深层目录扫描）
  let fullTree: { path: string }[] | null = null;
  let activeBranch = '';
  let finalMethod = 'None';

  for (const branch of branches) {
    const result = await getTreeViaWeb(owner, repo, branch);
    if (!result || result.tree.length === 0) continue;

    const { tree, method } = result;
    const isRecursive = tree.some((item: { path: string }) => item.path?.includes('/'));
    const currentIsRecursive = fullTree
      ? fullTree.some((item: { path: string }) => item.path?.includes('/'))
      : false;

    let shouldUpdate = false;
    if (fullTree === null) {
      shouldUpdate = true;
    } else {
      if (isRecursive && !currentIsRecursive) {
        shouldUpdate = true;
      } else if (isRecursive === currentIsRecursive && tree.length > fullTree.length) {
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      fullTree = tree;
      activeBranch = branch;
      finalMethod = method;
    }

    // 如果已经拿到了递归树，且规模尚可，就不用再试其他分支了
    const fullTreeIsRecursive = fullTree
      ? fullTree.some((item: { path: string }) => item.path?.includes('/'))
      : false;
    if (fullTreeIsRecursive && fullTree && fullTree.length > 100) {
      console.log(`[searchAllPackageFiles] 在分支 ${branch} 找到高质量递归树，停止后续分支探测`);
      break;
    }
  }

  const branchFiles: {
    path: string;
    data: PackageData;
    language: LanguageType;
    packageManager: PackageManagerType;
  }[] = [];
  const branchSeen = new Set<string>();

  if (fullTree) {
    const isRecursive = fullTree.some((item: { path: string }) => item.path?.includes('/'));
    console.log(`
╔════════════════════════════════════════════════════════════
║  【最终搜索方案确认】
║  目标仓库: ${owner}/${repo}
║  采用分支: ${activeBranch}
║  文件总数: ${fullTree.length}
║  递归扫描: ${isRecursive ? '✅ 已开启 (支持子目录)' : '❌ 未开启 (仅根目录)'}
║  技术手段: ${finalMethod}
╚════════════════════════════════════════════════════════════
    `);

    const treePaths = fullTree
      .map((item: { path: string }) => item.path)
      .filter((p) => p && !shouldSkipPath(p));

    const packagePaths: {
      path: string;
      language: LanguageType;
      packageManager: PackageManagerType;
    }[] = [];
    for (const item of fullTree) {
      const p = item.path;
      if (!p || shouldSkipPath(p)) continue;

      const fileInfo = getFileTypeInfo(p, treePaths);
      if (fileInfo) {
        packagePaths.push({
          path: p,
          language: fileInfo.language,
          packageManager: fileInfo.packageManager,
        });
      }
    }

    console.log(`[${activeBranch}] 筛选出 ${packagePaths.length} 个包文件`);

    const concurrency = 8;
    for (let i = 0; i < packagePaths.length; i += concurrency) {
      const batch = packagePaths.slice(i, i + concurrency);
      await Promise.allSettled(
        batch.map(async (pathInfo) => {
          if (branchSeen.has(pathInfo.path)) return;
          const resp = await fetchPackageResponse(owner, repo, activeBranch, pathInfo.path);
          if (resp) {
            console.log(`[${activeBranch}] 正在解析: ${pathInfo.path}`);
            const data = await parsePackageFile(resp, pathInfo.path, pathInfo.packageManager);
            branchFiles.push({
              path: pathInfo.path,
              data,
              language: pathInfo.language,
              packageManager: pathInfo.packageManager,
            });
            branchSeen.add(pathInfo.path);
          }
        }),
      );
    }
  } else {
    // 2. 如果全量树获取失败，回退到常用分支的根目录探测
    console.log(`全量树获取失败，回退到分支根目录探测`);
    for (const branch of branches) {
      const rootFetches: Promise<void>[] = [];
      for (const config of Object.values(packageManager)) {
        for (const fileName of config.files) {
          rootFetches.push(
            (async () => {
              if (branchSeen.has(fileName)) return;
              const resp = await fetchPackageResponse(owner, repo, branch, fileName);
              if (resp) {
                console.log(`[${branch}] 找到根目录文件: ${fileName}`);
                const data = await parsePackageFile(resp, fileName, config.type);
                branchFiles.push({
                  path: fileName,
                  data,
                  language: config.language,
                  packageManager: config.type,
                });
                branchSeen.add(fileName);
              }
            })(),
          );
        }
      }
      await Promise.allSettled(rootFetches);
      if (branchFiles.length > 0) break;
    }
  }

  const meta = fullTree
    ? {
        method: finalMethod,
        branch: activeBranch,
        itemCount: fullTree.length,
        isRecursive: fullTree.some((item: { path: string }) => item.path?.includes('/')),
      }
    : {
        method: 'Fallback_RootOnly',
        branch: 'all-common',
        itemCount: 0,
        isRecursive: false,
      };

  return { files: branchFiles, meta };
}
