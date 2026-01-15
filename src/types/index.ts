/**
 * 技术栈分析支持的编程语言。
 */
export type LanguageType =
  | 'javascript'
  | 'python'
  | 'rust'
  | 'java'
  | 'csharp'
  | 'swift'
  | 'cpp'
  | 'go';

/**
 * 支持的包管理工具类型。
 */
export type PackageManagerType =
  | 'npm'
  | 'pip'
  | 'poetry'
  | 'pipenv'
  | 'uv'
  | 'conda'
  | 'cargo'
  | 'maven'
  | 'gradle'
  | 'nuget'
  | 'swiftpm'
  | 'cocoapods'
  | 'carthage'
  | 'cmake'
  | 'bazel'
  | 'xmake'
  | 'gomod';

/**
 * 内容脚本、弹出框和后台脚本之间通信的消息动作。
 */
export type MessageAction = 'analyzeTechStack' | 'setLockPriorityFilter';

/**
 * 通过 browser.runtime.sendMessage 发送的消息结构。
 */
export interface RequestMessage {
  action: MessageAction;
  url?: string;
  value?: boolean | string | number | unknown;
}

/**
 * 原始包依赖数据。
 */
export interface PackageData {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * 技术项定义。
 */
export interface TechDefinition {
  key: string | string[];
  name: string;
}

/**
 * 技术项按管理器分组。
 */
export interface TechGroup {
  managers: PackageManagerType[];
  items: TechDefinition[];
}

/**
 * 技术分类定义，支持国际化。
 */
export interface TechCategory {
  id: string;
  label: {
    zh: string;
    en: string;
  };
  priority?: number; // 设为可选，因为我们要集中管理
  groups: TechGroup[];
}

/**
 * 项目中识别出的单个技术项。
 */
export interface TechItem {
  name: string;
  originalName: string;
  version: string;
  category: string; // 此时的 category 对应 TechCategory 的 id
}

/**
 * 仓库扫描的搜索元数据。
 */
export interface SearchMeta {
  method: string;
  branch: string;
  itemCount: number;
  isRecursive: boolean;
}

/**
 * 特定包文件的分析结果。
 */
export interface FileAnalysisResult {
  path: string;
  language: LanguageType;
  packageManager: PackageManagerType;
  techStack: TechItem[];
}

/**
 * 性能耗时摘要。
 */
export interface TimingsSummary {
  totalMs: number;
}

/**
 * 仓库探测的文件类型信息。
 */
export interface FileTypeInfo {
  extensions: string[];
  language: LanguageType;
  packageManager: PackageManagerType;
  displayName: string;
}

/**
 * 技术栈分析的响应结果。
 */
export interface AnalysisResponse {
  success: boolean;
  results?: FileAnalysisResult[];
  timings?: TimingsSummary;
  error?: string;
}
