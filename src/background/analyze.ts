import { categoryPriority, techStack } from '@/enums/techStack';
import type { AnalysisResponse, FileAnalysisResult, PackageData, TechItem } from '@/types';
import { searchAllPackageFiles } from './search';

/**
 * 分析仓库技术栈的主入口。
 * 协调搜索和分析过程。
 *
 * @param requestUrl 仓库的 URL
 * @returns 分析结果响应
 */
export async function analyzeTechStack(requestUrl: string): Promise<AnalysisResponse> {
  try {
    const t0 = performance.now();
    const url = new URL(requestUrl);
    const parts = url.pathname.split('/').filter((p) => p !== '');
    if (parts.length < 2) throw new Error('无效的 GitHub 仓库 URL');

    const owner = parts[0];
    const repo = parts[1];

    console.log(`[分析] 正在扫描仓库: ${owner}/${repo}`);
    const searchResult = await searchAllPackageFiles(owner, repo);
    const allPackages = searchResult.files;

    console.log(`[分析] 扫描完成，发现 ${allPackages.length} 个包管理文件`);

    if (allPackages.length === 0) {
      throw new Error('未找到包管理文件');
    }

    const fileAnalysisResults: FileAnalysisResult[] = allPackages.map((pkg) => ({
      path: pkg.path,
      language: pkg.language,
      packageManager: pkg.packageManager,
      techStack: analyzePackageData(pkg.data, pkg.packageManager),
    }));

    const t1 = performance.now();
    return {
      success: true,
      results: fileAnalysisResults,
      timings: { totalMs: t1 - t0 },
    };
  } catch (error) {
    console.error('[分析] 分析过程中出错:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 将依赖映射为技术栈清单。
 */
export function analyzePackageData(packageData: PackageData, packageManager: string): TechItem[] {
  if (!packageData) return [];

  const results: TechItem[] = [];

  const classifyAndPush = (dep: string, version: string, isDev: boolean) => {
    // 1. 尝试从配置中查找已知技术栈
    const knownTech = techStack[dep];
    // 检查是否存在该包，且包管理器是否匹配（如果配置了 managers）
    if (knownTech?.managers.includes(packageManager as any)) {
      results.push({
        name: knownTech.name,
        originalName: dep,
        version,
        category: knownTech.categoryId,
      });
      return;
    }

    // 2. 如果没找到，则标记为通用依赖
    results.push({
      name: dep,
      originalName: dep,
      version,
      category: isDev ? 'dev_dependency' : 'dependency',
    });
  };

  if (packageData.dependencies) {
    for (const [dep, version] of Object.entries(packageData.dependencies)) {
      if (shouldExcludePackage(dep)) continue;
      classifyAndPush(dep, version || 'unknown', false);
    }
  }

  if (packageData.devDependencies) {
    for (const [dep, version] of Object.entries(packageData.devDependencies)) {
      // 避免重复添加（如果已经在 dependencies 里处理过了）
      if (results.some((t) => t.originalName === dep)) continue;
      if (shouldExcludePackage(dep)) continue;
      classifyAndPush(dep, version || 'unknown', true);
    }
  }

  // 对最终结果按分类优先级排序
  results.sort((a, b) => {
    const prioA = categoryPriority[a.category] || 0;
    const prioB = categoryPriority[b.category] || 0;
    if (prioA !== prioB) return prioB - prioA;
    return a.name.localeCompare(b.name);
  });

  return results;
}

/**
 * 判断是否应排除某些包（如自身的元数据等）
 */
function shouldExcludePackage(name: string): boolean {
  const excludes = ['pipenv', 'poetry', 'uv', 'swiftpm', 'cocoapods', 'carthage'];
  return excludes.includes(name.toLowerCase());
}
