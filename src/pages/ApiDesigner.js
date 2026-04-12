import React, { useState } from 'react';
import SchemaBuilder from '../components/SchemaBuilder';
import './ApiDesigner.css';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLORS = {
  GET: '#68d391',
  POST: '#63b3ed',
  PUT: '#f6ad55',
  PATCH: '#b794f4',
  DELETE: '#fc8181'
};

const newApi = () => ({
  id: Date.now(),
  method: 'GET',
  path: '/resource',
  description: '',
  requestSchema: {},
  responseSchema: { id: 'int', message: 'string' }
});

export default function ApiDesigner({ apis, setApis }) {
  const [selectedId, setSelectedId] = useState(null);
  const [editingApi, setEditingApi] = useState(null);

  const selected = apis.find(a => a.id === selectedId);

  const handleAdd = () => {
    const api = newApi();
    setApis(prev => [...prev, api]);
    setSelectedId(api.id);
    setEditingApi({ ...api });
  };

  const handleSelect = (api) => {
    setSelectedId(api.id);
    setEditingApi({ ...api });
  };

  const handleSave = () => {
    if (!editingApi) return;
    setApis(prev => prev.map(a => a.id === editingApi.id ? { ...editingApi } : a));
  };

  const handleDelete = (id) => {
    setApis(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditingApi(null);
    }
  };

  const updateEditing = (field, val) => {
    setEditingApi(prev => ({ ...prev, [field]: val }));
  };

  // Check if editing has unsaved changes
  const isDirty = editingApi && selected && JSON.stringify(editingApi) !== JSON.stringify(selected);

  return (
    <div className="api-designer">
      {/* Left: API List */}
      <div className="api-list-panel">
        <div className="panel-header">
          <span className="panel-title">API 列表</span>
          <button className="add-api-btn" onClick={handleAdd}>+ 新增 API</button>
        </div>
        <div className="api-list">
          {apis.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⚡</div>
              <div className="empty-text">尚無 API</div>
              <div className="empty-sub">點擊「新增 API」開始設計</div>
            </div>
          )}
          {apis.map(api => (
            <div
              key={api.id}
              className={`api-list-item ${selectedId === api.id ? 'active' : ''}`}
              onClick={() => handleSelect(api)}
            >
              <span
                className="method-badge"
                style={{ color: METHOD_COLORS[api.method], borderColor: METHOD_COLORS[api.method] + '40' }}
              >
                {api.method}
              </span>
              <span className="api-path">{api.path}</span>
              <button
                className="api-delete-btn"
                onClick={e => { e.stopPropagation(); handleDelete(api.id); }}
                title="刪除"
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="api-editor-panel">
        {!editingApi ? (
          <div className="no-selection">
            <div className="no-sel-icon">📋</div>
            <div className="no-sel-text">選擇或新增一個 API 開始編輯</div>
          </div>
        ) : (
          <div className="editor-content">
            <div className="editor-header">
              <div className="editor-title">編輯 API</div>
              <div className="editor-actions">
                {isDirty && <span className="unsaved-badge">未儲存</span>}
                <button className="save-btn" onClick={handleSave}>儲存</button>
              </div>
            </div>

            {/* Method & Path */}
            <div className="form-row">
              <div className="form-group method-group">
                <label className="form-label">HTTP Method</label>
                <div className="method-buttons">
                  {HTTP_METHODS.map(m => (
                    <button
                      key={m}
                      className={`method-btn ${editingApi.method === m ? 'selected' : ''}`}
                      style={editingApi.method === m ? {
                        background: METHOD_COLORS[m] + '22',
                        color: METHOD_COLORS[m],
                        borderColor: METHOD_COLORS[m]
                      } : {}}
                      onClick={() => updateEditing('method', m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group path-group">
                <label className="form-label">路徑 (Path)</label>
                <input
                  className="form-input"
                  value={editingApi.path}
                  onChange={e => updateEditing('path', e.target.value)}
                  placeholder="/users/:id"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">描述 (Description)</label>
                <input
                  className="form-input"
                  value={editingApi.description}
                  onChange={e => updateEditing('description', e.target.value)}
                  placeholder="API 功能描述..."
                />
              </div>
            </div>

            {/* Schema Builders */}
            <div className="schema-row">
              <div className="schema-col">
                <SchemaBuilder
                  label="Request Schema"
                  schema={editingApi.requestSchema}
                  onChange={val => updateEditing('requestSchema', val)}
                />
              </div>
              <div className="schema-col">
                <SchemaBuilder
                  label="Response Schema"
                  schema={editingApi.responseSchema}
                  onChange={val => updateEditing('responseSchema', val)}
                />
              </div>
            </div>

            <div className="api-summary">
              <span style={{ color: METHOD_COLORS[editingApi.method] || '#e2e8f0', fontWeight: 700 }}>
                {editingApi.method}
              </span>
              {' '}
              <span style={{ color: '#a0aec0' }}>{editingApi.path}</span>
              {editingApi.description && (
                <span style={{ color: '#718096', marginLeft: 12 }}>— {editingApi.description}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
