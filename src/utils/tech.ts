import type { TechItem } from '@/types';

/**
 * 按类别对技术项进行分组。
 *
 * @param techStack 技术项数组。
 * @returns 一个记录对象，其键为类别，值为该类别的技术项数组。
 */
export const groupTechByCategory = (techStack: TechItem[]): Record<string, TechItem[]> => {
  return techStack.reduce((acc: Record<string, TechItem[]>, tech: TechItem) => {
    if (!acc[tech.category]) acc[tech.category] = [];
    acc[tech.category].push(tech);
    return acc;
  }, {});
};
