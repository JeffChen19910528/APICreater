import React, { useState } from 'react';
import './DatabaseImport.css';

const DB_TYPES = [
  { value: 'mysql',      label: 'MySQL',       defaultPort: 3306 },
  { value: 'postgresql', label: 'PostgreSQL',  defaultPort: 5432 },
  { value: 'sqlite',     label: 'SQLite',      defaultPort: null },
  { value: 'mssql',      label: 'MS SQL Server', defaultPort: 1433 },
  { value: 'oracle',     label: 'Oracle',      defaultPort: 1521 }
];

const CRUD_TEMPLATES = (tableName, columns) => {
  const colSchema = {};
  columns.forEach(c => { colSchema[c.name] = c.type; });
  const nonPkSchema = {};
  columns.filter(c => !c.primaryKey).forEach(c => { nonPkSchema[c.name] = c.type; });
  const pkCol = columns.find(c => c.primaryKey);
  const pkName = pkCol ? pkCol.name : 'id';

  const base = Date.now();
  return [
    {
      id: base + 1, method: 'GET',    path: `/${tableName}`,
      description: `取得所有 ${tableName}`,
      requestSchema: {}, responseSchema: colSchema,
      tableName, tableColumns: columns
    },
    {
      id: base + 2, method: 'GET',    path: `/${tableName}/:${pkName}`,
      description: `取得單筆 ${tableName}`,
      requestSchema: {}, responseSchema: colSchema,
      tableName, tableColumns: columns
    },
    {
      id: base + 3, method: 'POST',   path: `/${tableName}`,
      description: `建立 ${tableName}`,
      requestSchema: nonPkSchema, responseSchema: colSchema,
      tableName, tableColumns: columns
    },
    {
      id: base + 4, method: 'PUT',    path: `/${tableName}/:${pkName}`,
      description: `更新 ${tableName}`,
      requestSchema: nonPkSchema, responseSchema: colSchema,
      tableName, tableColumns: columns
    },
    {
      id: base + 5, method: 'DELETE', path: `/${tableName}/:${pkName}`,
      description: `刪除 ${tableName}`,
      requestSchema: {}, responseSchema: { message: 'string' },
      tableName, tableColumns: columns
    }
  ];
};

export default function DatabaseImport({ setApis, onNavigate, setDbConfig }) {
  const [dbType, setDbType] = useState('mysql');
  const [form, setForm] = useState({
    host: 'localhost', port: '3306', database: '', serviceName: '',
    username: '', password: '', filePath: ''
  });
  const [connecting, setConnecting] = useState(false);
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState({});

  const currentDbType = DB_TYPES.find(d => d.value === dbType);

  const handleTypeChange = (type) => {
    setDbType(type);
    setSchema(null);
    setError('');
    setSelected({});
    const dbInfo = DB_TYPES.find(d => d.value === type);
    setForm(prev => ({
      ...prev,
      port: dbInfo.defaultPort ? String(dbInfo.defaultPort) : ''
    }));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBrowseSqlite = async () => {
    if (!window.electronAPI) return;
    const path = await window.electronAPI.selectSqliteFile();
    if (path) handleChange('filePath', path);
  };

  const buildDbConfig = () => {
    const base = { type: dbType, ...form, port: parseInt(form.port) || undefined };
    return base;
  };

  const handleConnect = async () => {
    setError('');
    setSchema(null);
    setSelected({});
    setConnecting(true);
    try {
      if (!window.electronAPI) {
        setError('僅在 Electron 桌面環境中支援資料庫連線。');
        return;
      }
      const dbConfig = buildDbConfig();
      const result = await window.electronAPI.dbConnect(dbConfig);
      if (result.success) {
        setSchema(result.schema);
        const all = {};
        Object.keys(result.schema).forEach(t => { all[t] = true; });
        setSelected(all);
      } else {
        setError(result.error || '連線失敗');
      }
    } catch (err) {
      setError(err.message || '未知錯誤');
    } finally {
      setConnecting(false);
    }
  };

  const toggleTable = (tableName) => {
    setSelected(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const toggleAll = (val) => {
    const next = {};
    Object.keys(schema).forEach(t => { next[t] = val; });
    setSelected(next);
  };

  const handleImport = () => {
    const newApis = [];
    Object.entries(selected).forEach(([tableName, isSelected]) => {
      if (!isSelected) return;
      const columns = schema[tableName];
      newApis.push(...CRUD_TEMPLATES(tableName, columns));
    });
    if (newApis.length === 0) return;

    setApis(prev => [...prev, ...newApis]);
    if (setDbConfig) setDbConfig(buildDbConfig());
    onNavigate('designer');
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const isSqlite = dbType === 'sqlite';
  const isOracle = dbType === 'oracle';

  return (
    <div className="db-import">
      <div className="db-import-header">
        <h2 className="db-import-title">資料庫匯入</h2>
        <p className="db-import-sub">連接資料庫，自動從資料表產生 CRUD API</p>
      </div>

      {/* DB Type Tabs */}
      <div className="db-type-tabs">
        {DB_TYPES.map(d => (
          <button
            key={d.value}
            className={`db-type-tab ${dbType === d.value ? 'active' : ''}`}
            onClick={() => handleTypeChange(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Connection Form */}
      <div className="db-form">
        {isSqlite ? (
          <div className="form-row">
            <label className="form-label">資料庫檔案路徑</label>
            <div className="sqlite-path-row">
              <input
                className="form-input flex-1"
                value={form.filePath}
                onChange={e => handleChange('filePath', e.target.value)}
                placeholder="/path/to/database.db"
              />
              <button className="browse-btn" onClick={handleBrowseSqlite}>
                瀏覽...
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">主機 (Host)</label>
                <input
                  className="form-input"
                  value={form.host}
                  onChange={e => handleChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div className="form-group form-group-sm">
                <label className="form-label">Port</label>
                <input
                  className="form-input"
                  value={form.port}
                  onChange={e => handleChange('port', e.target.value)}
                  placeholder={String(currentDbType?.defaultPort || '')}
                />
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">{isOracle ? '服務名稱 (Service Name)' : '資料庫名稱 (Database)'}</label>
              <input
                className="form-input"
                value={isOracle ? form.serviceName : form.database}
                onChange={e => handleChange(isOracle ? 'serviceName' : 'database', e.target.value)}
                placeholder={isOracle ? 'XEPDB1' : 'mydb'}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">使用者名稱 (Username)</label>
                <input
                  className="form-input"
                  value={form.username}
                  onChange={e => handleChange('username', e.target.value)}
                  placeholder={isOracle ? 'hr' : dbType === 'postgresql' ? 'postgres' : 'root'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">密碼 (Password)</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="密碼"
                />
              </div>
            </div>
          </>
        )}

        <button
          className={`connect-btn ${connecting ? 'loading' : ''}`}
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? '連線中...' : '連線並讀取資料表'}
        </button>

        {error && <div className="db-error">{error}</div>}
      </div>

      {/* Table List */}
      {schema && (
        <div className="table-section">
          <div className="table-section-header">
            <span className="table-section-title">
              資料表列表 ({Object.keys(schema).length} 張資料表)
            </span>
            <div className="table-actions">
              <button className="select-btn" onClick={() => toggleAll(true)}>全選</button>
              <button className="select-btn" onClick={() => toggleAll(false)}>取消全選</button>
            </div>
          </div>

          <div className="table-list">
            {Object.entries(schema).map(([tableName, columns]) => (
              <div
                key={tableName}
                className={`table-item ${selected[tableName] ? 'selected' : ''}`}
                onClick={() => toggleTable(tableName)}
              >
                <div className="table-item-check">
                  <input
                    type="checkbox"
                    checked={!!selected[tableName]}
                    onChange={() => toggleTable(tableName)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="table-item-info">
                  <div className="table-item-name">{tableName}</div>
                  <div className="table-item-cols">
                    {columns.map(c => (
                      <span
                        key={c.name}
                        className={`col-badge ${c.primaryKey ? 'pk' : ''}`}
                        title={`${c.name}: ${c.type}${c.primaryKey ? ' (PK)' : ''}`}
                      >
                        {c.primaryKey ? '🔑 ' : ''}{c.name}
                        <span className="col-type">{c.type}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="table-item-count">
                  {columns.length} 欄
                </div>
              </div>
            ))}
          </div>

          <div className="import-footer">
            <span className="import-count">
              已選 {selectedCount} 張資料表 → 將產生 {selectedCount * 5} 個 API
            </span>
            <button
              className="import-btn"
              onClick={handleImport}
              disabled={selectedCount === 0}
            >
              匯入至 API 設計器
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
