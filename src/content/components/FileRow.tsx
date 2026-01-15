import type React from 'react';
import { getGitHubFileUrl, getPackageManagerDisplayName } from '@/utils/github';

interface FileRowProps {
  path: string;
  isActive: boolean;
  onClick: () => void;
  lang: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const FileRow: React.FC<FileRowProps> = ({ path, isActive, onClick, lang, isFirst, isLast }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: isActive ? '#ffffff' : 'transparent',
        border: '1px solid #d0d7de',
        borderBottom: isActive ? '1px solid #ffffff' : '1px solid #d0d7de',
        borderRadius: `${isFirst ? '6px' : '0'} ${isFirst ? '6px' : '0'} ${isLast ? '6px' : '0'} ${isLast ? '6px' : '0'}`,
        cursor: 'pointer',
        fontSize: '12px',
        color: isActive ? '#24292f' : '#656d76',
        marginBottom: '-1px',
        textAlign: 'left',
        position: 'relative',
        zIndex: isActive ? 1 : 0,
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
          {getPackageManagerDisplayName(path)}
        </span>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'left',
          }}
          title={path}
        >
          {path}
        </span>
      </div>
      <a
        href={getGitHubFileUrl(path)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          marginLeft: '8px',
          fontSize: '11px',
          color: '#0969da',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        {lang === 'zh' ? '打开' : 'Open'}
      </a>
    </button>
  );
};

export default FileRow;
