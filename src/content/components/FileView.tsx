import { categoryLabels, categoryOrder } from '@/enums/techStack';
import type { FileAnalysisResult, TimingsSummary } from '@/types';
import { groupTechByCategory } from '@/utils/tech';

interface FileViewProps {
  file: FileAnalysisResult | null;
  timings?: TimingsSummary;
  duration?: number;
  lang?: 'zh' | 'en';
}

export function FileView({ file, timings, duration, lang = 'zh' }: FileViewProps) {
  if (!file) {
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
        {lang === 'zh' ? '未检测到任何包管理文件' : 'No package management files detected'}
      </div>
    );
  }

  const grouped = groupTechByCategory(file.techStack);

  // 1. 先按预定义顺序提取存在的类别
  const orderedCategories = categoryOrder.filter((cat) => grouped[cat]);

  // 2. 再追加未在预定义顺序中的其他类别
  Object.keys(grouped).forEach((cat) => {
    if (!orderedCategories.includes(cat)) {
      orderedCategories.push(cat);
    }
  });

  return (
    <div>
      <div
        style={{
          fontSize: '12px',
          color: '#656d76',
          marginBottom: '8px',
          fontStyle: 'italic',
        }}
      >
        {lang === 'zh' ? '文件路径' : 'File Path'}: {file.path}
      </div>
      {file.techStack.length > 0 ? (
        <div>
          {orderedCategories.map((category) => (
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
                ? `共发现 ${file.techStack.length} 个技术项`
                : `Found ${file.techStack.length} tech items`}
              {timings && timings.totalMs > 0
                ? `，${lang === 'zh' ? '总耗时' : 'Total time'} ${(timings.totalMs / 1000).toFixed(2)} s`
                : duration && duration > 0
                  ? `，${lang === 'zh' ? '耗时' : 'Time'} ${duration.toFixed(2)} s`
                  : ''}
            </div>
          </div>
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
          该文件中未检测到依赖项
        </div>
      )}
    </div>
  );
}
