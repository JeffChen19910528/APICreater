import React from 'react';
import './SchemaBuilder.css';

const FIELD_TYPES = ['string', 'int', 'number', 'boolean', 'array', 'object'];

function SchemaField({ fieldKey, value, onChange, onRemove, depth = 0 }) {
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);

  const handleTypeChange = (newType) => {
    if (newType === 'object') {
      onChange(fieldKey, {});
    } else {
      onChange(fieldKey, newType);
    }
  };

  const handleChildChange = (childKey, childVal) => {
    onChange(fieldKey, { ...value, [childKey]: childVal });
  };

  const handleChildRemove = (childKey) => {
    const newVal = { ...value };
    delete newVal[childKey];
    onChange(fieldKey, newVal);
  };

  const addChildField = () => {
    const newKey = `field${Object.keys(value).length + 1}`;
    onChange(fieldKey, { ...value, [newKey]: 'string' });
  };

  return (
    <div className={`schema-field depth-${depth}`}>
      <div className="field-row">
        <span className="field-indent" style={{ width: depth * 16 }} />
        {isObject ? (
          <span className="field-collapse-icon">▼</span>
        ) : null}
        <input
          className="field-key-input"
          value={fieldKey}
          readOnly
          title={fieldKey}
        />
        <span className="field-colon">:</span>
        {isObject ? (
          <span className="field-type-tag object-tag">object</span>
        ) : (
          <select
            className="field-type-select"
            value={value}
            onChange={e => handleTypeChange(e.target.value)}
          >
            {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <button className="field-remove-btn" onClick={() => onRemove(fieldKey)} title="移除欄位">✕</button>
      </div>

      {isObject && (
        <div className="nested-fields">
          {Object.entries(value).map(([k, v]) => (
            <SchemaField
              key={k}
              fieldKey={k}
              value={v}
              onChange={handleChildChange}
              onRemove={handleChildRemove}
              depth={depth + 1}
            />
          ))}
          <button className="add-nested-btn" onClick={addChildField}>
            + 新增子欄位
          </button>
        </div>
      )}
    </div>
  );
}

export default function SchemaBuilder({ label, schema, onChange }) {
  const fields = schema || {};

  const handleAddField = () => {
    const newKey = `field${Object.keys(fields).length + 1}`;
    onChange({ ...fields, [newKey]: 'string' });
  };

  const handleChange = (key, val) => {
    onChange({ ...fields, [key]: val });
  };

  const handleRemove = (key) => {
    const next = { ...fields };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="schema-builder">
      <div className="schema-header">
        <span className="schema-label">{label}</span>
        <button className="add-field-btn" onClick={handleAddField}>+ 新增欄位</button>
      </div>
      <div className="schema-body">
        {Object.keys(fields).length === 0 ? (
          <div className="schema-empty">尚無欄位，點擊「新增欄位」開始</div>
        ) : (
          Object.entries(fields).map(([k, v]) => (
            <SchemaField
              key={k}
              fieldKey={k}
              value={v}
              onChange={handleChange}
              onRemove={handleRemove}
              depth={0}
            />
          ))
        )}
      </div>
      <div className="schema-preview">
        <pre>{JSON.stringify(fields, null, 2)}</pre>
      </div>
    </div>
  );
}
