import type React from 'react';
import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import './App.css';

const App: React.FC = () => {
  const [mergeByLanguage, setMergeByLanguage] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('auto');

  useEffect(() => {
    // 从 storage 加载设置
    if (browser.storage?.sync) {
      void browser.storage.sync.get(['mergeByLanguage', 'language']).then((result) => {
        if (typeof result.mergeByLanguage === 'boolean') {
          setMergeByLanguage(result.mergeByLanguage);
        }
        if (typeof result.language === 'string') {
          setLanguage(result.language);
        }
      });
    }
  }, []);

  const toggleMerge = async () => {
    const newValue = !mergeByLanguage;
    setMergeByLanguage(newValue);
    if (browser.storage?.sync) {
      await browser.storage.sync.set({ mergeByLanguage: newValue });
    }
  };

  const changeLanguage = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (browser.storage?.sync) {
      await browser.storage.sync.set({ language: newLang });
    }
  };

  // 获取当前实际使用的语言 (用于 popup 自身的展示)
  const currentLang = (
    language === 'auto' ? (navigator.language.startsWith('zh') ? 'zh' : 'en') : language
  ) as 'zh' | 'en';

  const translations = {
    zh: {
      title: '栈查查 设置',
      mergeLabel: '合并相同包',
      mergeHint: '开启后，会合并相同包管理器',
      languageLabel: '语言 (Language)',
      auto: '自动检测',
      zh: '简体中文',
      en: 'English',
      officialWebsite: '官网',
    },
    en: {
      title: 'zhanStack Settings',
      mergeLabel: 'Merge identical packages',
      mergeHint: 'When enabled, identical packages from different package managers will be merged.',
      languageLabel: 'Language',
      auto: 'Auto Detect',
      zh: '简体中文',
      en: 'English',
      officialWebsite: 'Official Website',
    },
  };

  const t = translations[currentLang] || translations.en;

  return (
    <div className="app">
      <header
        className="app-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1>{t.title}</h1>
        <a
          href="https://softsoft.pro/softs/zhan-stack"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '12px', color: '#0969da', textDecoration: 'none' }}
        >
          {t.officialWebsite}
        </a>
      </header>

      <main className="app-main">
        <div className="option-row">
          <span className="option-label">{t.mergeLabel}</span>
          <button
            type="button"
            onClick={toggleMerge}
            className={`toggle-switch ${mergeByLanguage ? 'active' : ''}`}
          >
            <div className="toggle-thumb" />
          </button>
        </div>
        <div className="option-row" style={{ marginTop: '16px' }}>
          <span className="option-label">{t.languageLabel}</span>
          <select className="language-select" value={language} onChange={changeLanguage}>
            <option value="auto">{t.auto}</option>
            <option value="zh">{t.zh}</option>
            <option value="en">{t.en}</option>
          </select>
        </div>
      </main>
    </div>
  );
};

export default App;
