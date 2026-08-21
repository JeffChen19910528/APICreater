import React, { useState, useEffect } from 'react';
import { buildFiles } from '../generator/buildFiles';
import './CodePreview.css';

const isElectron = () => typeof window !== 'undefined' && window.electronAPI;

// ─── Syntax Highlighters ──────────────────────────────────────────────────────

function escapeHtml(code) {
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJS(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(const|let|var|function|require|module|exports|return|if|else|for|async|await|new)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightPython(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(from|import|def|class|return|if|else|elif|for|in|async|await|True|False|None|with|as)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/(@\w+)/g, '<span class="hl-decorator">$1</span>')
    .replace(/\b(str|int|float|bool|list|dict|Any|Optional|List|BaseModel)\b/g, '<span class="hl-type">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightCsharp(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(using|namespace|class|public|private|protected|static|void|var|new|return|if|else|string|int|bool|double|object|null)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/(\[[A-Za-z]+[^\]]*\])/g, '<span class="hl-decorator">$1</span>')
    .replace(/\b(IActionResult|ControllerBase|ApiController|FromBody|FromRoute|Ok|NotFound|BadRequest)\b/g, '<span class="hl-type">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightJava(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(package|import|public|private|protected|class|interface|extends|implements|new|return|if|else|for|while|void|static|final|null|true|false|this|super|throws|throw)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/(@\w+)/g, '<span class="hl-decorator">$1</span>')
    .replace(/\b(String|Integer|Double|Boolean|Object|List|Map|ResponseEntity|RestController|GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping|PathVariable|RequestBody|SpringApplication)\b/g, '<span class="hl-type">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightJson(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="hl-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="hl-str">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightXml(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(&lt;\/?[\w.]+)/g, '<span class="hl-kw">$1</span>')
    .replace(/(&gt;)/g, '<span class="hl-kw">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>');
}

function highlight(code, language, filename) {
  if (!code) return '';
  if (filename && filename.endsWith('.json')) return highlightJson(code);
  if (filename && (filename.endsWith('.csproj') || filename.endsWith('.xml') || filename === 'pom.xml')) return highlightXml(code);
  if (filename && filename.endsWith('.properties')) return highlightJson(code);
  switch (language) {
    case 'python': return highlightPython(code);
    case 'csharp': return highlightCsharp(code);
    case 'java':   return highlightJava(code);
    default:       return highlightJS(code);
  }
}

// ─── File Tree Groups ─────────────────────────────────────────────────────────

function getFileGroups(files, language) {
  const keys = Object.keys(files);
  if (language === 'python') {
    return {
      'Root': keys.filter(f => !f.includes('/')),
      'Routers': keys.filter(f => f.startsWith('routers/')),
      'Models': keys.filter(f => f.startsWith('models/'))
    };
  }
  if (language === 'csharp') {
    return {
      'Root': keys.filter(f => !f.includes('/')),
      'Controllers': keys.filter(f => f.startsWith('Controllers/')),
      'Models': keys.filter(f => f.startsWith('Models/'))
    };
  }
  if (language === 'java') {
    return {
      'Root': keys.filter(f => !f.includes('/') || f === 'pom.xml'),
      'Application': keys.filter(f => f.endsWith('Application.java') || f.endsWith('application.properties')),
      'Controllers': keys.filter(f => f.includes('/controller/')),
      'Models': keys.filter(f => f.includes('/model/'))
    };
  }
  return {
    'Root': keys.filter(f => !f.includes('/')),
    'Routes': keys.filter(f => f.startsWith('routes/')),
    'Controllers': keys.filter(f => f.startsWith('controllers/')),
    'Models': keys.filter(f => f.startsWith('models/'))
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodePreview({ apis, projectName, language, version, dbConfig }) {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePreview = async () => {
    if (!apis || apis.length === 0) {
      setFiles({});
      setError('尚無 API，請先在「API 設計器」新增 API。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let preview;
      if (isElectron()) {
        const result = await window.electronAPI.previewCode({ apis, projectName, language, version, dbConfig });
        if (!result.success) throw new Error(result.error);
        preview = result.preview;
      } else {
        preview = buildFiles(apis, projectName, language, version, dbConfig);
      }
      setFiles(preview);
      setSelectedFile(Object.keys(preview)[0] || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePreview();
    // eslint-disable-next-line
  }, [apis, projectName, language, version, dbConfig]);

  const fileGroups = getFileGroups(files, language);

  const langLabel = { nodejs: 'Node.js', python: 'Python', csharp: 'C#', java: 'Java' }[language] || language;

  return (
    <div className="code-preview">
      <div className="preview-sidebar">
        <div className="preview-header">
          <span className="preview-title">程式碼預覽 <span className="lang-tag">{langLabel}</span></span>
          <button className="refresh-btn" onClick={generatePreview} disabled={loading}>
            {loading ? '載入...' : '重整'}
          </button>
        </div>
        <div className="file-tree">
          {error ? (
            <div className="preview-error">{error}</div>
          ) : (
            Object.entries(fileGroups).map(([group, groupFiles]) =>
              groupFiles.length > 0 && (
                <div key={group} className="file-group">
                  <div className="file-group-label">{group}</div>
                  {groupFiles.map(f => (
                    <button
                      key={f}
                      className={`file-item ${selectedFile === f ? 'active' : ''}`}
                      onClick={() => setSelectedFile(f)}
                    >
                      <span className="file-icon">{fileIcon(f)}</span>
                      <span className="file-name">{f.split('/').pop()}</span>
                    </button>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="code-area">
        {selectedFile && files[selectedFile] !== undefined ? (
          <>
            <div className="code-tab-bar">
              <span className="code-tab active">{selectedFile}</span>
            </div>
            <div className="code-scroll">
              <pre
                className="code-content"
                dangerouslySetInnerHTML={{ __html: highlight(files[selectedFile], language, selectedFile) }}
              />
            </div>
          </>
        ) : (
          <div className="code-placeholder">
            {apis.length === 0 ? '請先在 API 設計器新增 API' : '選擇左側檔案查看程式碼'}
          </div>
        )}
      </div>
    </div>
  );
}

function fileIcon(filename) {
  if (filename.endsWith('.py')) return 'py';
  if (filename.endsWith('.cs')) return 'cs';
  if (filename.endsWith('.java')) return 'java';
  if (filename.endsWith('.json')) return '{}';
  if (filename.endsWith('.csproj') || filename === 'pom.xml') return 'xml';
  if (filename.endsWith('.txt')) return 'txt';
  if (filename.endsWith('.md')) return 'md';
  if (filename.endsWith('.properties')) return 'cfg';
  return 'js';
}
