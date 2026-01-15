import { packageManager } from '@/enums/packageManager';
import type { FileTypeInfo, LanguageType } from '@/types';

/**
 * 获取文件对应的包管理器信息。
 *
 * @param filePath 文件路径
 * @param tree 可选的文件树列表，用于解决语言歧义（如 packages.config）
 */
export function getFileTypeInfo(filePath: string, tree?: string[]): FileTypeInfo | undefined {
  const fileName = (filePath.split('/').pop() || filePath).toLowerCase();

  for (const config of Object.values(packageManager)) {
    const isMatch =
      config.files.some((f) => f.toLowerCase() === fileName) ||
      config.extensions?.some((ext) => fileName.endsWith(ext.toLowerCase()));

    if (isMatch) {
      let language = config.language;
      if (tree) {
        language = resolveLanguageContext(filePath, tree, config.language);
      }

      return {
        extensions: config.files,
        language,
        packageManager: config.type,
        displayName: config.displayName,
      };
    }
  }

  return undefined;
}

/**
 * 根据项目文件树解决特定文件的语言上下文（例如解决 packages.config 是 C# 还是 C++）。
 *
 * @param filePath 当前正在处理的包管理文件路径
 * @param tree 整个项目的文件路径列表
 * @param defaultLanguage 配置中定义的默认语言
 */
export function resolveLanguageContext(
  filePath: string,
  tree: string[],
  defaultLanguage: LanguageType,
): LanguageType {
  const fileName = (filePath.split('/').pop() || filePath).toLowerCase();

  // 目前主要处理 packages.config 的多语言冲突
  if (fileName === 'packages.config') {
    const hasCsharpIndicators = tree.some((p) => p.endsWith('.csproj') || p.endsWith('.cs'));
    const hasCppIndicators = tree.some(
      (p) =>
        p.endsWith('.vcxproj') ||
        p.endsWith('.cpp') ||
        p.endsWith('.cc') ||
        p.endsWith('.cxx') ||
        p.endsWith('CMakeLists.txt'),
    );

    if (hasCsharpIndicators && !hasCppIndicators) return 'csharp';
    if (hasCppIndicators) return 'cpp';
  }

  return defaultLanguage;
}
