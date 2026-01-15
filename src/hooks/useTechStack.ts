import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoryPriority } from '@/enums/techStack';
import type { FileAnalysisResult, TechItem } from '@/types';
import { getPackageManagerDisplayName } from '@/utils/github';

/**
 * 管理技术栈数据和逻辑的自定义 Hook。
 */
export function useTechStack(techStack: FileAnalysisResult[]) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [expandedLangs, setExpandedLangs] = useState<Record<string, boolean>>({});
  const [activeTabsByLang, setActiveTabsByLang] = useState<Record<string, number>>({});
  const [mergedByLang, setMergedByLang] = useState<Record<string, TechItem[]>>({});
  const [activeLangIndex, setActiveLangIndex] = useState<number>(0);
  const [activeIsFile, setActiveIsFile] = useState<boolean>(false);

  useEffect(() => {
    if (techStack.length > 0) {
      setActiveTab(0);
    }
    setActiveLangIndex(0);
    setActiveIsFile(false);
  }, [techStack]);

  const filesSortedByMgr = useMemo(() => {
    const arr = [...techStack];
    arr.sort((a, b) => {
      const ma = getPackageManagerDisplayName(a.path);
      const mb = getPackageManagerDisplayName(b.path);
      const byMgr = ma.localeCompare(mb);
      if (byMgr !== 0) return byMgr;
      return a.path.localeCompare(b.path);
    });
    return arr;
  }, [techStack]);

  const mergeTech = useCallback((items: TechItem[]): TechItem[] => {
    const map: Record<string, TechItem> = {};
    for (const it of items) {
      const key = it.originalName || it.name;
      if (!map[key]) {
        map[key] = { ...it };
      } else {
        const cur = map[key];
        const betterCat =
          (categoryPriority[it.category] || 0) > (categoryPriority[cur.category] || 0);
        const curVerUnknown = !cur.version || cur.version === 'unknown';
        const nextVerKnown = it.version && it.version !== 'unknown';

        if (betterCat) {
          map[key] = { ...it };
        } else if (curVerUnknown && nextVerKnown) {
          map[key] = { ...cur, version: it.version };
        }
      }
    }

    const arr = Object.values(map);
    const getPriority = (it: TechItem) => categoryPriority[it.category] || 0;

    return arr.sort((a, b) => getPriority(b) - getPriority(a));
  }, []);

  useEffect(() => {
    const grouped: Record<string, TechItem[]> = {};
    for (const file of techStack) {
      const mgr = getPackageManagerDisplayName(file.path);
      if (!grouped[mgr]) grouped[mgr] = [];
      grouped[mgr] = grouped[mgr].concat(file.techStack);
    }

    const merged: Record<string, TechItem[]> = {};
    Object.keys(grouped).forEach((mgr) => {
      merged[mgr] = mergeTech(grouped[mgr]);
    });

    setMergedByLang(merged);
  }, [techStack, mergeTech]);

  return {
    activeTab,
    setActiveTab,
    expandedLangs,
    setExpandedLangs,
    activeTabsByLang,
    setActiveTabsByLang,
    mergedByLang,
    activeLangIndex,
    setActiveLangIndex,
    activeIsFile,
    setActiveIsFile,
    filesSortedByMgr,
  };
}
