import type { PackageManagerType, TechCategory } from '@/types';
import { async_runtime } from './tech_stacks/async_runtime';
import { browser_extension } from './tech_stacks/browser_extension';
import { build_tool } from './tech_stacks/build_tool';
import { css_framework } from './tech_stacks/css_framework';
import { css_in_js } from './tech_stacks/css_in_js';
import { css_preprocessor } from './tech_stacks/css_preprocessor';
import { data_fetching } from './tech_stacks/data_fetching';
import { date } from './tech_stacks/date';
import { dependency } from './tech_stacks/dependency';
import { dev_dependency } from './tech_stacks/dev_dependency';
import { doc } from './tech_stacks/doc';
import { framework } from './tech_stacks/framework';
import { git_hooks } from './tech_stacks/git_hooks';
import { image } from './tech_stacks/image';
import { layout } from './tech_stacks/layout';
import { lint } from './tech_stacks/lint';
import { network } from './tech_stacks/network';
import { orm } from './tech_stacks/orm';
import { reactive } from './tech_stacks/reactive';
import { state_management } from './tech_stacks/state_management';
import { testing } from './tech_stacks/testing';
import { ui_library } from './tech_stacks/ui_library';

/**
 * 易于序列化的技术栈原始配置。
 * 汇总各分类配置文件，并在汇总处统一管理优先级（决定显示顺序）。
 */
export const techStackConfig: TechCategory[] = [
  { ...framework, priority: 100 },
  { ...browser_extension, priority: 98 },
  { ...state_management, priority: 95 },
  { ...data_fetching, priority: 92 },
  { ...orm, priority: 90 },
  { ...ui_library, priority: 88 },
  { ...async_runtime, priority: 85 },
  { ...build_tool, priority: 80 },
  { ...testing, priority: 70 },
  { ...network, priority: 60 },
  { ...layout, priority: 55 },
  { ...reactive, priority: 50 },
  { ...css_framework, priority: 45 },
  { ...css_preprocessor, priority: 40 },
  { ...css_in_js, priority: 35 },
  { ...image, priority: 30 },
  { ...date, priority: 28 },
  { ...lint, priority: 25 },
  { ...doc, priority: 22 },
  { ...git_hooks, priority: 21 },
  { ...dependency, priority: 10 },
  { ...dev_dependency, priority: 5 },
];

/**
 * 自动生成的包查找表。
 * 格式：{ "包名": { name: "展示名", categoryId: "分类ID", managers: ["包管理器"] } }
 */
export const techStackLookup: Record<
  string,
  { name: string; categoryId: string; managers: PackageManagerType[] }
> = techStackConfig.reduce(
  (acc, category) => {
    category.groups.forEach((group) => {
      group.items.forEach((item) => {
        const keys = Array.isArray(item.key) ? item.key : [item.key];
        keys.forEach((k) => {
          acc[k] = {
            name: item.name,
            categoryId: category.id,
            managers: group.managers,
          };
        });
      });
    });
    return acc;
  },
  {} as Record<string, { name: string; categoryId: string; managers: PackageManagerType[] }>,
);

/**
 * 分类优先级 Map。
 */
export const categoryPriority: Record<string, number> = techStackConfig.reduce(
  (acc, cat) => {
    acc[cat.id] = cat.priority || 0;
    return acc;
  },
  {} as Record<string, number>,
);

/**
 * 分类展示顺序数组（按优先级从高到低）。
 */
export const categoryOrder: string[] = [...techStackConfig]
  .sort((a, b) => (b.priority || 0) - (a.priority || 0))
  .map((cat) => cat.id);

/**
 * 分类标签映射（支持国际化）。
 */
export const categoryLabels: Record<string, { zh: string; en: string }> = techStackConfig.reduce(
  (acc, cat) => {
    acc[cat.id] = cat.label;
    return acc;
  },
  {} as Record<string, { zh: string; en: string }>,
);

// 为了保持向后兼容，导出旧版 techStack 的 key (虽然内容结构变了)
export const techStack = techStackLookup;
