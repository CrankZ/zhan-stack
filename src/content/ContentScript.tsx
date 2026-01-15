import type React from 'react';
import { useEffect, useState } from 'react';
import { useTechStack } from '@/hooks/useTechStack';
import type { FileAnalysisResult, SearchMeta, TimingsSummary } from '@/types';
import FileRow from './components/FileRow';
import { FileView } from './components/FileView';
import { MergedView } from './components/MergedView';

interface ContentScriptProps {
  techStack?: FileAnalysisResult[];
  error?: string | null;
  isAnalyzing?: boolean;
  duration?: number;
  timings?: TimingsSummary;
  meta?: SearchMeta;
  mergeByLanguage?: boolean;
  preferredLanguage?: string;
}

const TechStackDisplay: React.FC<ContentScriptProps> = ({
  techStack = [],
  error = null,
  isAnalyzing = false,
  duration = 0,
  timings,
  meta,
  mergeByLanguage = true,
  preferredLanguage = 'auto',
}) => {
  const lang = (
    preferredLanguage === 'auto'
      ? navigator.language.startsWith('zh')
        ? 'zh'
        : 'en'
      : preferredLanguage
  ) as 'zh' | 'en';

  const [visible, setVisible] = useState<boolean>(true);
  const {
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
  } = useTechStack(techStack);

  useEffect(() => {
    if (meta) {
      console.log(
        `[Zhan Stack] 搜索元数据:\n` +
          `  技术手段: ${meta.method}\n` +
          `  采用分支: ${meta.branch}\n` +
          `  递归扫描: ${meta.isRecursive ? '✅' : '❌'}\n` +
          `  文件总数: ${meta.itemCount}`,
      );
    }
  }, [meta]);

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  return (
    <div
      className="github-tech-stack-container Box Box--condensed"
      style={{
        marginBottom: '16px',
        borderRadius: '6px',
        border: '1px solid #d0d7de',
        backgroundColor: '#f6f8fa',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        className="Box-header d-flex flex-items-center flex-justify-between"
        style={{ padding: 0, border: 'none' }}
      >
        <button
          type="button"
          onClick={toggleVisibility}
          style={{
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: '#fafbfc',
            borderRadius: visible ? '6px 6px 0 0' : '6px',
            border: 'none',
            borderBottom: visible ? '1px solid #d0d7de' : 'none',
            fontWeight: 600,
            color: '#24292f',
            fontSize: '14px',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {lang === 'zh' ? '技术栈' : 'Tech Stack'}
          </span>
          <span
            style={{
              fontSize: '14px',
              color: '#656d76',
            }}
          >
            {visible ? '−' : '+'}
          </span>
        </button>
      </div>

      {visible && (
        <div className="Box-body" style={{ padding: '12px 16px' }}>
          {error && (
            <div
              style={{
                padding: '8px',
                backgroundColor: '#ffebe9',
                color: '#cf222e',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '12px',
                border: '1px solid rgba(207, 34, 46, 0.2)',
                wordBreak: 'break-all',
              }}
            >
              <strong>{lang === 'zh' ? '错误：' : 'Error: '}</strong>
              {error}
            </div>
          )}

          {isAnalyzing ? (
            <div
              style={{
                padding: '8px',
                textAlign: 'center',
                fontStyle: 'italic',
                color: '#656d76',
                fontSize: '12px',
              }}
            >
              {lang === 'zh' ? '分析中...' : 'Analyzing...'}
            </div>
          ) : techStack.length > 0 ? (
            <div>
              {mergeByLanguage ? (
                <MergedView
                  localTechStack={techStack}
                  mergedByLang={mergedByLang}
                  expandedLangs={expandedLangs}
                  activeLangIndex={activeLangIndex}
                  activeIsFile={activeIsFile}
                  activeTabsByLang={activeTabsByLang}
                  setExpandedLangs={setExpandedLangs}
                  setActiveLangIndex={setActiveLangIndex}
                  setActiveIsFile={setActiveIsFile}
                  setActiveTabsByLang={setActiveTabsByLang}
                  timings={timings}
                  duration={duration}
                  lang={lang}
                />
              ) : (
                <div>
                  <div
                    style={{
                      marginBottom: '12px',
                    }}
                  >
                    {filesSortedByMgr.map((fileResult, index) => (
                      <FileRow
                        key={fileResult.path}
                        path={fileResult.path}
                        isActive={activeTab === index}
                        onClick={() => setActiveTab(index)}
                        lang={lang}
                        isFirst={index === 0}
                        isLast={index === filesSortedByMgr.length - 1}
                      />
                    ))}
                  </div>
                  <FileView
                    file={filesSortedByMgr[activeTab]}
                    timings={timings}
                    duration={duration}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '8px',
                textAlign: 'center',
                fontStyle: 'italic',
                color: '#656d76',
                fontSize: '12px',
              }}
            >
              {lang === 'zh' ? '未检测到任何包管理文件' : 'No package management files detected'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TechStackDisplay;
