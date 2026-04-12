import React, { useState } from 'react';
import { getVersionLabel } from '../utils/versions';
import './ExportPage.css';

const isElectron = () => typeof window !== 'undefined' && window.electronAPI;

const LANG_LABELS = {
  nodejs: 'Node.js (Express)',
  python: 'Python (FastAPI)',
  csharp: 'C# (ASP.NET Core)'
};

const START_COMMANDS = {
  nodejs: 'npm install && npm start',
  python: 'pip install -r requirements.txt && uvicorn main:app --reload',
  csharp: 'dotnet restore && dotnet run'
};

const DEFAULT_PORTS = {
  nodejs: 'http://localhost:3000',
  python: 'http://localhost:8000/docs',
  csharp: 'https://localhost:7000/swagger'
};

export default function ExportPage({ apis, projectName, language, version, onNavigate }) {
  const [outputDir, setOutputDir] = useState('');
  const [status, setStatus] = useState(null);
  const [resultPath, setResultPath] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectDir = async () => {
    if (!isElectron()) { alert('請在 Electron 桌面應用程式中使用此功能。'); return; }
    const dir = await window.electronAPI.selectOutputDir();
    if (dir) setOutputDir(dir);
  };

  const handleGenerate = async () => {
    if (!outputDir) { alert('請先選擇輸出資料夾。'); return; }
    if (apis.length === 0) { alert('尚無 API，請先在「API 設計器」新增 API。'); return; }

    setStatus('generating');
    setErrorMsg('');

    try {
      if (!isElectron()) throw new Error('請在 Electron 桌面應用程式中使用此功能。');
      const result = await window.electronAPI.generateProject({
        apis, projectName, language, version, outputDir
      });
      if (result.success) { setResultPath(result.projectPath); setStatus('success'); }
      else throw new Error(result.error);
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const canGenerate = outputDir && apis.length > 0;
  const versionLabel = getVersionLabel(language, version);
  const startCmd = START_COMMANDS[language] || '';
  const defaultPort = DEFAULT_PORTS[language] || '';

  return (
    <div className="export-page">
      <div className="export-container">
        <div className="export-header">
          <h1 className="export-title">匯出專案</h1>
          <p className="export-subtitle">將設計好的 API 產生為可部署的專案</p>
        </div>

        {/* Summary Cards */}
        <div className="export-summary">
          <div className="summary-card">
            <div className="summary-icon">⚡</div>
            <div className="summary-info">
              <div className="summary-label">專案名稱</div>
              <div className="summary-value">{projectName}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📋</div>
            <div className="summary-info">
              <div className="summary-label">API 數量</div>
              <div className="summary-value">{apis.length} 個</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🔧</div>
            <div className="summary-info">
              <div className="summary-label">語言 / 版本</div>
              <div className="summary-value">{LANG_LABELS[language] || language}</div>
              <div className="summary-version">{versionLabel}</div>
            </div>
          </div>
        </div>

        {/* 版本詳細資訊 */}
        <div className="version-info-box">
          <div className="version-info-title">部署資訊</div>
          <div className="version-info-row">
            <span className="vi-label">版本</span>
            <code className="vi-value">{versionLabel}</code>
          </div>
          <div className="version-info-row">
            <span className="vi-label">啟動指令</span>
            <code className="vi-value">{startCmd}</code>
          </div>
          <div className="version-info-row">
            <span className="vi-label">預設位址</span>
            <code className="vi-value">{defaultPort}</code>
          </div>
        </div>

        {apis.length === 0 && (
          <div className="warning-box">
            尚無 API 設計。
            <button className="warning-link" onClick={() => onNavigate('designer')}>前往 API 設計器</button>
            新增 API 後再匯出。
          </div>
        )}

        {/* API list */}
        {apis.length > 0 && (
          <div className="api-preview-list">
            <div className="section-title">將匯出的 API</div>
            <div className="api-preview-table">
              <div className="api-table-header">
                <span>Method</span><span>Path</span><span>描述</span>
              </div>
              {apis.map(api => (
                <div key={api.id} className="api-table-row">
                  <span className={`method-tag method-${api.method.toLowerCase()}`}>{api.method}</span>
                  <span className="path-text">{api.path}</span>
                  <span className="desc-text">{api.description || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output dir */}
        <div className="output-section">
          <div className="section-title">輸出路徑</div>
          <div className="dir-row">
            <div className="dir-input-wrap">
              <input className="dir-input" value={outputDir} readOnly placeholder="選擇輸出資料夾..." />
            </div>
            <button className="browse-btn" onClick={handleSelectDir}>瀏覽...</button>
          </div>
          {outputDir && (
            <div className="output-preview-path">
              將產生於：<code>{outputDir}/{projectName}/</code>
            </div>
          )}
        </div>

        {/* Generate */}
        <div className="generate-section">
          <button
            className={`generate-btn ${!canGenerate ? 'disabled' : ''}`}
            onClick={handleGenerate}
            disabled={!canGenerate || status === 'generating'}
          >
            {status === 'generating' ? '產生中...' : `產生 ${LANG_LABELS[language] || ''} 專案`}
          </button>
        </div>

        {/* Result */}
        {status === 'success' && (
          <div className="result-box success">
            <div className="result-icon">✓</div>
            <div className="result-info">
              <div className="result-title">專案產生成功！</div>
              <div className="result-path">{resultPath}</div>
              <div className="result-hint">
                進入資料夾執行：<code>{startCmd}</code>
              </div>
              <div className="result-hint" style={{ marginTop: 4 }}>
                服務啟動後開啟：<code>{defaultPort}</code>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="result-box error">
            <div className="result-icon">✕</div>
            <div className="result-info">
              <div className="result-title">產生失敗</div>
              <div className="result-path">{errorMsg}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
