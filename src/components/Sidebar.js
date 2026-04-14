import React, { useState } from 'react';
import { LANGUAGE_VERSIONS, BADGE_COLORS } from '../utils/versions';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'designer', label: 'API 設計器', icon: '⚙' },
  { id: 'preview',  label: '程式碼預覽', icon: '📄' },
  { id: 'export',   label: '匯出專案',   icon: '📦' }
];

const LANGUAGES = [
  { value: 'nodejs',  label: 'Node.js (Express)' },
  { value: 'python',  label: 'Python (FastAPI)'   },
  { value: 'csharp',  label: 'C# (ASP.NET Core)'  },
  { value: 'java',    label: 'Java (Spring Boot)'  }
];

export default function Sidebar({
  currentPage, onNavigate,
  projectName, onProjectNameChange,
  language, onLanguageChange,
  version, onVersionChange,
  apiCount
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const handleNameBlur = () => {
    setEditingName(false);
    if (tempName.trim()) onProjectNameChange(tempName.trim());
  };

  const versions = LANGUAGE_VERSIONS[language] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">API Generator</span>
        </div>
      </div>

      {/* 專案名稱 */}
      <div className="sidebar-section">
        <label className="sidebar-label">專案名稱</label>
        {editingName ? (
          <input
            className="project-name-input"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={e => e.key === 'Enter' && handleNameBlur()}
            autoFocus
          />
        ) : (
          <div className="project-name" onClick={() => { setEditingName(true); setTempName(projectName); }}>
            {projectName}
            <span className="edit-icon">✏</span>
          </div>
        )}
      </div>

      {/* 語言選擇 */}
      <div className="sidebar-section">
        <label className="sidebar-label">目標語言</label>
        <div className="lang-buttons">
          {LANGUAGES.map(l => (
            <button
              key={l.value}
              className={`lang-btn ${language === l.value ? 'active' : ''}`}
              onClick={() => onLanguageChange(l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* 版本選擇 */}
      <div className="sidebar-section version-section">
        <label className="sidebar-label">版本選擇</label>
        <div className="version-list">
          {versions.map(v => {
            const badgeStyle = BADGE_COLORS[v.badge] || BADGE_COLORS.Stable;
            const isSelected = version === v.value;
            return (
              <button
                key={v.value}
                className={`version-item ${isSelected ? 'active' : ''}`}
                onClick={() => onVersionChange(v.value)}
              >
                <div className="version-top">
                  <span className="version-label">{v.label}</span>
                  <span
                    className="version-badge"
                    style={{
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.border}`
                    }}
                  >
                    {v.badge}
                  </span>
                </div>
                <div className="version-desc">{v.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 導覽 */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'designer' && apiCount > 0 && (
              <span className="nav-badge">{apiCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-text">API Generator v1.0</div>
        <div className="footer-sub">Electron + React</div>
      </div>
    </aside>
  );
}
