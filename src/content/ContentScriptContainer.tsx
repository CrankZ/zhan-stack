import type React from 'react';
import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import type { AnalysisResponse, FileAnalysisResult, SearchMeta } from '@/types';
import ContentScript from './ContentScript';

const ContentScriptContainer: React.FC = () => {
  const [techStack, setTechStack] = useState<FileAnalysisResult[]>([]);
  const [timings, setTimings] = useState<{ totalMs: number } | undefined>(undefined);
  const [meta, setMeta] = useState<SearchMeta | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [mergeByLanguage, setMergeByLanguage] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('auto');

  useEffect(() => {
    // 加载初始设置
    if (browser.storage?.sync) {
      browser.storage.sync.get(['mergeByLanguage', 'language']).then((result) => {
        if (typeof result.mergeByLanguage === 'boolean') {
          setMergeByLanguage(result.mergeByLanguage);
        }
        if (typeof result.language === 'string') {
          setLanguage(result.language);
        }
      });

      // 监听设置变化
      const handleStorageChange = (changes: { [key: string]: any }) => {
        if (changes.mergeByLanguage) {
          setMergeByLanguage(changes.mergeByLanguage.newValue);
        }
        if (changes.language) {
          setLanguage(changes.language.newValue);
        }
      };
      browser.storage.onChanged.addListener(handleStorageChange);

      return () => {
        browser.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const analyze = async () => {
      try {
        const response = (await browser.runtime.sendMessage({
          action: 'analyzeTechStack',
          url: window.location.href,
        })) as AnalysisResponse;

        if (!mounted) return;

        if (response.success) {
          setTechStack(response.results || []);
          setTimings(response.timings);
          // @ts-expect-error - meta is still handled as part of results in some places
          setMeta(response.meta);
          setIsAnalyzing(false);
        } else {
          setError(response.error ?? '分析仓库失败');
          setIsAnalyzing(false);
        }
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || '分析仓库失败');
        setIsAnalyzing(false);
      }
    };

    analyze();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ContentScript
      techStack={techStack}
      timings={timings}
      meta={meta}
      error={error}
      isAnalyzing={isAnalyzing}
      mergeByLanguage={mergeByLanguage}
      preferredLanguage={language}
    />
  );
};

export default ContentScriptContainer;
