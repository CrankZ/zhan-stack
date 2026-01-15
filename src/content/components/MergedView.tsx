import { categoryLabels, categoryOrder } from '@/enums/techStack';
import type { FileAnalysisResult, SearchMeta, TechItem, TimingsSummary } from '@/types';
import { groupTechByCategory } from '@/utils/tech';
import FileRow from './FileRow';
import { FileView } from './FileView';

interface MergedViewProps {
  localTechStack: FileAnalysisResult[];
  mergedByLang: Record<string, TechItem[]>;
  expandedLangs: Record<string, boolean>;
  activeLangIndex: number;
  activeIsFile: boolean;
  activeTabsByLang: Record<string, number>;
  setExpandedLangs: (next: Record<string, boolean>) => void;
  setActiveLangIndex: (idx: number) => void;
  setActiveIsFile: (v: boolean) => void;
  setActiveTabsByLang: (next: Record<string, number>) => void;
  timings?: TimingsSummary;
  duration?: number;
  meta?: SearchMeta;
  lang?: 'zh' | 'en';
}

export function MergedView(props: MergedViewProps) {
  const {
    localTechStack,
    mergedByLang,
    expandedLangs,
    activeLangIndex,
    activeIsFile,
    activeTabsByLang,
    setExpandedLangs,
    setActiveLangIndex,
    setActiveIsFile,
    setActiveTabsByLang,
    timings,
    duration,
    lang = 'zh',
  } = props;

  const mgrs = Array.from(
    new Set(localTechStack.map((f) => getPackageManagerDisplayName(f.path))),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <div style={{ borderBottom: '1px solid #d0d7de', marginBottom: '12px' }}>
        {mgrs.map((mgr, index) => {
          const files = localTechStack.filter((f) => getPackageManagerDisplayName(f.path) === mgr);
          const expanded = !!expandedLangs[mgr];
          const isActiveParent = activeLangIndex === index && !activeIsFile;
          return (
            <div key={mgr} style={{ marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveLangIndex(index);
                  setActiveIsFile(false);
                  setExpandedLangs({ ...expandedLangs, [mgr]: !expanded });
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  backgroundColor: isActiveParent ? '#ffffff' : 'transparent',
                  border: '1px solid #d0d7de',
                  borderBottom: expanded ? '1px solid #ffffff' : '1px solid #d0d7de',
                  borderRadius: expanded ? '6px 6px 0 0' : '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: isActiveParent ? '#24292f' : '#656d76',
                  textAlign: 'left',
                  position: 'relative',
                  zIndex: isActiveParent ? 1 : 0,
                  marginBottom: expanded ? '-1px' : '0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#656d76',
                      backgroundColor: '#f6f8fa',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {mgr}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d0d7de',
                      borderRadius: '2em',
                      padding: '0 6px',
                      fontSize: '10px',
                      color: '#24292f',
                    }}
                  >
                    {files.length}
                  </span>
                </div>
                <span style={{ fontSize: '14px', color: '#656d76' }}>{expanded ? '−' : '+'}</span>
              </button>

              {expanded && (
                <div style={{ marginTop: '0px' }}>
                  {files.map((fileResult, fi) => (
                    <FileRow
                      key={fileResult.path}
                      path={fileResult.path}
                      isActive={
                        activeLangIndex === index &&
                        activeIsFile &&
                        (activeTabsByLang[mgr] ?? 0) === fi
                      }
                      onClick={() => {
                        setActiveLangIndex(index);
                        setActiveTabsByLang({
                          ...activeTabsByLang,
                          [mgr]: fi,
                        });
                        setActiveIsFile(true);
                      }}
                      lang={lang}
                      isFirst={false}
                      isLast={fi === files.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(() => {
        const activeMgr = mgrs[activeLangIndex];
        if (!activeIsFile) {
          const merged = mergedByLang[activeMgr] || [];
          if (merged.length === 0) {
            return (
              <div
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  color: '#656d76',
                  fontSize: '12px',
                }}
              >
                {lang === 'zh'
                  ? '该包管理器未检测到依赖项'
                  : 'No dependencies detected for this manager'}
              </div>
            );
          }
          const grouped = groupTechByCategory(merged);

          // 1. 先按预定义顺序提取存在的类别
          const ordered = categoryOrder.filter((cat) => grouped[cat]);

          // 2. 再追加未在预定义顺序中的其他类别
          Object.keys(grouped).forEach((cat) => {
            if (!ordered.includes(cat)) {
              ordered.push(cat);
            }
          });
          return (
            <div>
              {ordered.map((category) => (
                <div key={category} style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#656d76',
                      marginBottom: '4px',
                    }}
                  >
                    {categoryLabels[category]?.[lang] || category}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {grouped[category].map((tech) => (
                      <span
                        key={`${tech.name}-${tech.version || 'unknown'}`}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d0d7de',
                          borderRadius: '2em',
                          padding: '2px 8px',
                          fontSize: '12px',
                          color: '#24292f',
                        }}
                      >
                        {tech.name}
                        {tech.version && tech.version !== 'unknown' ? ` @${tech.version}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #d0d7de',
                  fontSize: '11px',
                  color: '#656d76',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  {lang === 'zh'
                    ? `共发现 ${merged.length} 个技术项`
                    : `Found ${merged.length} tech items`}
                  {timings && timings.totalMs > 0
                    ? `，${lang === 'zh' ? '总耗时' : 'Total time'} ${(timings.totalMs / 1000).toFixed(2)} s`
                    : duration && duration > 0
                      ? `，${lang === 'zh' ? '耗时' : 'Time'} ${duration.toFixed(2)} s`
                      : ''}
                </div>
              </div>
            </div>
          );
        }
        const files = localTechStack.filter(
          (f) => getPackageManagerDisplayName(f.path) === activeMgr,
        );
        const fi = activeTabsByLang[activeMgr] ?? 0;
        const file = files[fi] ?? null;
        return <FileView file={file} timings={timings} duration={duration} lang={lang} />;
      })()}
    </div>
  );
}
