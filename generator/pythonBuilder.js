// ─── Python FastAPI Code Generator ───────────────────────────────────────────

// ─── Version Configurations ───────────────────────────────────────────────────

const PYTHON_VERSION_CONFIG = {
  pydantic2: {
    fastapi: 'fastapi>=0.115.0',
    uvicorn: 'uvicorn[standard]>=0.30.0',
    pydantic: 'pydantic>=2.0.0',
    pythonMin: '3.10',
    pydanticVersion: 2,
    useOptional: false,    // can use str | None natively
    hasClassConfig: false, // no class Config in Pydantic v2
    label: 'FastAPI 0.115+ / Pydantic v2'
  },
  pydantic1: {
    fastapi: 'fastapi>=0.95.0,<0.100.0',
    uvicorn: 'uvicorn[standard]>=0.22.0',
    pydantic: 'pydantic>=1.10.0,<2.0.0',
    pythonMin: '3.8',
    pydanticVersion: 1,
    useOptional: true,     // must use Optional[str]
    hasClassConfig: true,  // Pydantic v1 class Config
    label: 'FastAPI 0.95+ / Pydantic v1'
  },
  legacy: {
    fastapi: 'fastapi>=0.68.0,<0.95.0',
    uvicorn: 'uvicorn>=0.17.0',
    pydantic: 'pydantic>=1.6.0,<2.0.0',
    pythonMin: '3.7',
    pydanticVersion: 1,
    useOptional: true,
    hasClassConfig: true,
    label: 'FastAPI 0.68+ / Pydantic v1 (Legacy)'
  }
};

// ─── Type Mapping ─────────────────────────────────────────────────────────────

function toPythonType(val, cfg) {
  if (typeof val === 'object' && val !== null) return 'dict';
  const useBuiltinGenerics = cfg && cfg.pydanticVersion === 2;
  switch (val) {
    case 'string':  return 'str';
    case 'int':     return 'int';
    case 'number':  return 'float';
    case 'boolean': return 'bool';
    case 'array':   return useBuiltinGenerics ? 'list[Any]' : 'List[Any]';
    default:        return 'Any';
  }
}

function toPythonSample(val) {
  if (typeof val === 'object' && val !== null) return '{}';
  switch (val) {
    case 'string':  return '"example"';
    case 'int':     return '0';
    case 'number':  return '0.0';
    case 'boolean': return 'True';
    case 'array':   return '[]';
    default:        return 'None';
  }
}

function toFastAPIPath(path) {
  return path.replace(/:(\w+)/g, '{$1}');
}

function extractPathParams(path) {
  return (path.match(/:(\w+)/g) || []).map(p => p.slice(1));
}

function toSnakeHandler(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p =>
    p.startsWith(':') ? 'by_' + p.slice(1) : p
  );
  return method.toLowerCase() + '_' + parts.join('_').replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function groupByResource(apis) {
  const groups = {};
  for (const api of apis) {
    const parts = api.path.replace(/^\//, '').split('/');
    const resource = parts[0] || 'index';
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(api);
  }
  return groups;
}

// ─── Build Pydantic Model Fields ──────────────────────────────────────────────

function buildModelFields(schema, cfg, indent = '    ') {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    return `${indent}pass`;
  }
  const lines = Object.entries(schema).map(([key, val]) => {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return `${indent}${key}: dict = {}`;
    }
    const pyType = toPythonType(val, cfg);
    const sample = toPythonSample(val);
    return `${indent}${key}: ${pyType} = ${sample}`;
  });

  // Pydantic v1 adds class Config at end
  if (cfg.hasClassConfig) {
    lines.push('');
    lines.push(`${indent}class Config:`);
    lines.push(`${indent}    orm_mode = True`);
  }
  return lines.join('\n');
}

function buildReturnDict(schema) {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    return '{"message": "ok"}';
  }
  const entries = Object.entries(schema).map(([k, v]) => {
    if (typeof v === 'object' && v !== null) return `"${k}": {}`;
    return `"${k}": ${toPythonSample(v)}`;
  });
  return `{${entries.join(', ')}}`;
}

// ─── Typing imports ───────────────────────────────────────────────────────────

function buildTypingImports(cfg) {
  if (cfg.pydanticVersion === 2) {
    return 'from typing import Any';
  }
  return 'from typing import Any, List, Optional';
}

// ─── Main builder ─────────────────────────────────────────────────────────────

function buildPythonFiles(apis, projectName, version = 'pydantic2') {
  const cfg = PYTHON_VERSION_CONFIG[version] || PYTHON_VERSION_CONFIG.pydantic2;
  const files = {};
  const groups = groupByResource(apis);
  const resourceNames = Object.keys(groups);

  // ── main.py ──
  files['main.py'] = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
${resourceNames.map(r => `from routers import ${r}`).join('\n')}

app = FastAPI(
    title="${projectName}",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

${resourceNames.map(r => `app.include_router(${r}.router, prefix="/${r}", tags=["${r}"])`).join('\n')}

@app.get("/")
def root():
    return {"message": "${projectName} is running"}
`;

  // ── requirements.txt ──
  files['requirements.txt'] = `# Generated by API Generator — ${cfg.label}
# Python ${cfg.pythonMin}+ required
${cfg.fastapi}
${cfg.uvicorn}
${cfg.pydantic}
`;

  // ── README.md ──
  files['README.md'] = `# ${projectName}

Generated by **API Generator** — ${cfg.label}.

## Requirements

- Python ${cfg.pythonMin}+

## Getting Started

\`\`\`bash
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

Swagger UI: http://localhost:8000/docs

## Endpoints

${apis.map(api => `### ${api.method} \`${api.path}\`\n${api.description ? `> ${api.description}\n` : ''}`).join('\n')}
`;

  // ── __init__.py ──
  files['routers/__init__.py'] = '';
  files['models/__init__.py'] = '';

  for (const [resource, endpoints] of Object.entries(groups)) {

    // Collect model class names for import
    const modelImports = [];
    endpoints.forEach(ep => {
      const handler = toSnakeHandler(ep.method, ep.path);
      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0)
        modelImports.push(`${capitalize(handler)}Request`);
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0)
        modelImports.push(`${capitalize(handler)}Response`);
    });
    const uniqueImports = [...new Set(modelImports)];

    // ── models/<resource>.py ──
    let modelFile = `from pydantic import BaseModel\n${buildTypingImports(cfg)}\n\n`;

    endpoints.forEach(ep => {
      const handler = toSnakeHandler(ep.method, ep.path);
      const reqFields = buildModelFields(ep.requestSchema, cfg);
      const resFields = buildModelFields(ep.responseSchema, cfg);

      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0) {
        modelFile += `\nclass ${capitalize(handler)}Request(BaseModel):\n${reqFields}\n`;
      }
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0) {
        modelFile += `\nclass ${capitalize(handler)}Response(BaseModel):\n${resFields}\n`;
      }
    });

    files[`models/${resource}.py`] = modelFile;

    // ── routers/<resource>.py ──
    let routerFile = `from fastapi import APIRouter, HTTPException\n${buildTypingImports(cfg)}\n`;
    if (uniqueImports.length > 0) {
      routerFile += `from models.${resource} import ${uniqueImports.join(', ')}\n`;
    }
    routerFile += `\nrouter = APIRouter()\n\n`;

    endpoints.forEach(ep => {
      const handler = toSnakeHandler(ep.method, ep.path);
      const subPath = ep.path.replace(new RegExp(`^/?${resource}`), '') || '/';
      const fastapiPath = toFastAPIPath(subPath) || '/';
      const pathParams = extractPathParams(ep.path);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) &&
                      ep.requestSchema && Object.keys(ep.requestSchema).length > 0;

      const params = [
        ...pathParams.map(p => `${p}: str`),
        hasBody ? `body: ${capitalize(handler)}Request` : null
      ].filter(Boolean).join(', ');

      const retVal = buildReturnDict(ep.responseSchema);

      if (ep.description) routerFile += `# ${ep.description}\n`;
      routerFile += `@router.${ep.method.toLowerCase()}("${fastapiPath}")\n`;

      // Pydantic v2 uses async natively, v1 uses sync
      if (cfg.pydanticVersion === 2) {
        routerFile += `async def ${handler}(${params}):\n    # TODO: implement logic\n    return ${retVal}\n\n`;
      } else {
        routerFile += `def ${handler}(${params}):\n    # TODO: implement logic\n    return ${retVal}\n\n`;
      }
    });

    files[`routers/${resource}.py`] = routerFile;
  }

  return files;
}

module.exports = { buildPythonFiles };
