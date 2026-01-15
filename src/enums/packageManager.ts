import type { LanguageType, PackageManagerType } from '@/types';

/**
 * 包管理器的详细定义
 */
export interface PackageManagerDefinition {
  type: PackageManagerType;
  displayName: string;
  language: LanguageType;
  files: string[]; // 完整匹配的文件名
  extensions?: string[]; // 匹配后缀（如 .csproj）
  /**
   * 用于辅助判断项目类型的特征文件或后缀。
   * 主要用于处理多个语言共享同一个包管理文件的情况（如 packages.config）。
   */
  indicators?: {
    files?: string[];
    extensions?: string[];
  };
  /** 清单文件，如 package.json */
  manifest?: string;
  /**
   * 用于识别技术栈的配置。
   * 按照类别 (Framework, Build Tool 等) 组织。
   */
  techStackMap?: Record<string, { name: string; category: string }>;
}

/**
 * 以包管理器为维度的统一配置。
 * 核心维度是 PackageManagerType（如 'npm', 'maven', 'pip'）。
 */
export const packageManager: Record<PackageManagerType, PackageManagerDefinition> = {
  'npm': {
    type: 'npm',
    displayName: 'npm',
    language: 'javascript',
    files: ['package.json'],
    manifest: 'package.json',
  },
  'pip': {
    type: 'pip',
    displayName: 'pip',
    language: 'python',
    files: ['requirements.txt'],
    manifest: 'requirements.txt',
  },
  'poetry': {
    type: 'poetry',
    displayName: 'Poetry',
    language: 'python',
    files: ['pyproject.toml'],
    manifest: 'pyproject.toml',
  },
  'pipenv': {
    type: 'pipenv',
    displayName: 'Pipenv',
    language: 'python',
    files: ['Pipfile'],
    manifest: 'Pipfile',
  },
  'uv': {
    type: 'uv',
    displayName: 'uv',
    language: 'python',
    files: ['pyproject.toml'],
    manifest: 'pyproject.toml',
  },
  'conda': {
    type: 'conda',
    displayName: 'Conda',
    language: 'python',
    files: ['environment.yml', 'environment.yaml'],
    manifest: 'environment.yml',
  },
  'cargo': {
    type: 'cargo',
    displayName: 'Cargo',
    language: 'rust',
    files: ['Cargo.toml'],
    manifest: 'Cargo.toml',
  },
  'maven': {
    type: 'maven',
    displayName: 'Maven',
    language: 'java',
    files: ['pom.xml'],
    manifest: 'pom.xml',
  },
  'gradle': {
    type: 'gradle',
    displayName: 'Gradle',
    language: 'java',
    files: ['build.gradle'],
    manifest: 'build.gradle',
  },
  'nuget': {
    type: 'nuget',
    displayName: 'NuGet',
    language: 'csharp',
    files: ['packages.config', 'Directory.Packages.props'],
    extensions: ['.csproj', '.vcxproj', '.sln'],
    indicators: {
      extensions: ['.csproj', '.vcxproj', '.sln'],
    },
  },
  'swiftpm': {
    type: 'swiftpm',
    displayName: 'SwiftPM',
    language: 'swift',
    files: ['Package.swift'],
    manifest: 'Package.swift',
  },
  'cocoapods': {
    type: 'cocoapods',
    displayName: 'CocoaPods',
    language: 'swift',
    files: ['Podfile'],
    manifest: 'Podfile',
  },
  'carthage': {
    type: 'carthage',
    displayName: 'Carthage',
    language: 'swift',
    files: ['Cartfile'],
    manifest: 'Cartfile',
  },
  'cmake': {
    type: 'cmake',
    displayName: 'CMake',
    language: 'cpp',
    files: ['CMakeLists.txt'],
    manifest: 'CMakeLists.txt',
  },
  'bazel': {
    type: 'bazel',
    displayName: 'Bazel',
    language: 'cpp',
    files: ['MODULE.bazel', 'WORKSPACE', 'WORKSPACE.bazel'],
  },
  'xmake': {
    type: 'xmake',
    displayName: 'xmake',
    language: 'cpp',
    files: ['xmake.lua'],
  },
  'gomod': {
    type: 'gomod',
    displayName: 'Go Modules',
    language: 'go',
    files: ['go.mod'],
    manifest: 'go.mod',
  },
};
