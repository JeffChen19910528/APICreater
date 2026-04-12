/**
 * 各語言版本設定檔
 * UI 與 generator 共用同一份定義
 */

export const LANGUAGE_VERSIONS = {
  nodejs: [
    {
      value: 'express4',
      label: 'Express 4.x',
      description: 'Node.js 14+ · 最穩定，伺服器相容性最佳',
      badge: 'LTS',
      default: true
    },
    {
      value: 'express5',
      label: 'Express 5.x',
      description: 'Node.js 18+ · async 錯誤自動傳遞',
      badge: 'Latest'
    }
  ],
  python: [
    {
      value: 'pydantic2',
      label: 'FastAPI 0.115+ / Pydantic v2',
      description: 'Python 3.10+ · 效能最佳，型別驗證升級',
      badge: 'Latest',
      default: true
    },
    {
      value: 'pydantic1',
      label: 'FastAPI 0.95+ / Pydantic v1',
      description: 'Python 3.8+ · 廣泛部署，Optional 語法',
      badge: 'Stable'
    },
    {
      value: 'legacy',
      label: 'FastAPI 0.68+ / Pydantic v1',
      description: 'Python 3.7+ · 舊伺服器相容（Ubuntu 18/20）',
      badge: 'Legacy'
    }
  ],
  csharp: [
    {
      value: 'net8',
      label: '.NET 8.0',
      description: 'LTS 2026 · Minimal Hosting，效能最佳',
      badge: 'LTS',
      default: true
    },
    {
      value: 'net6',
      label: '.NET 6.0',
      description: 'LTS 2024 · Minimal Hosting，廣泛企業使用',
      badge: 'LTS'
    },
    {
      value: 'net5',
      label: '.NET 5.0',
      description: '2021 · Minimal Hosting，IIS 8+ 相容',
      badge: 'EOL'
    },
    {
      value: 'net31',
      label: '.NET Core 3.1',
      description: '2022 · Startup.cs 模式，Windows Server 2012+',
      badge: 'Legacy'
    }
  ]
};

export const BADGE_COLORS = {
  Latest: { bg: '#1a3a4a', color: '#63b3ed', border: '#2b6cb0' },
  LTS:    { bg: '#1a3a2a', color: '#68d391', border: '#2f855a' },
  Stable: { bg: '#2d2a1a', color: '#f6ad55', border: '#744210' },
  EOL:    { bg: '#2d1a1a', color: '#fc8181', border: '#742929' },
  Legacy: { bg: '#2a1a3a', color: '#b794f4', border: '#553c9a' }
};

export function getDefaultVersion(language) {
  const versions = LANGUAGE_VERSIONS[language] || [];
  const def = versions.find(v => v.default);
  return def ? def.value : (versions[0] ? versions[0].value : '');
}

export function getVersionLabel(language, version) {
  const versions = LANGUAGE_VERSIONS[language] || [];
  const v = versions.find(x => x.value === version);
  return v ? v.label : version;
}
