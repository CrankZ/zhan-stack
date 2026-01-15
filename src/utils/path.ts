/**
 * 确定在扫描期间是否应跳过某个仓库路径。
 * 过滤掉常见的构建产物、临时目录和依赖文件夹。
 *
 * @param filePath 要检查的相对路径。
 * @returns 如果路径应被忽略，则返回 true。
 */
export function shouldSkipPath(filePath: string): boolean {
  const parts = filePath.split('/');
  const excludedDirs = new Set([
    'node_modules', // JS/TS
    'dist',
    'build',
    'out', // 通用构建产物
    '.next',
    '.nuxt',
    '.svelte-kit', // 前端框架
    'vendor', // PHP/Composer
    'venv',
    '.venv',
    'env',
    'site-packages',
    '__pycache__', // Python
    'target', // Rust/Maven
    'bin',
    'obj', // .NET/C#
    '.build', // SwiftPM
    'Pods', // CocoaPods
    'Carthage', // Carthage
    'DerivedData', // Xcode 构建缓存
  ]);

  for (const seg of parts) {
    if (excludedDirs.has(seg)) return true;
    if (seg.startsWith('cmake-build-')) return true; // CMake 构建模式
  }

  return false;
}
