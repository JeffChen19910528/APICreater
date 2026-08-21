// ─── Python FastAPI Code Generator ───────────────────────────────────────────

const { groupByResource, getTableMeta } = require('./shared');

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

// ─── DB helpers ───────────────────────────────────────────────────────────────

const PYTHON_DB_PACKAGES = {
  mysql:      ['databases[mysql]', 'aiomysql', 'python-dotenv'],
  postgresql: ['databases[postgresql]', 'asyncpg', 'python-dotenv'],
  sqlite:     ['databases[sqlite]', 'aiosqlite', 'python-dotenv'],
  mssql:      ['pyodbc', 'python-dotenv'],
  oracle:     ['cx_Oracle', 'python-dotenv']
};

const PYTHON_ASYNC_DB = ['mysql', 'postgresql', 'sqlite'];

function buildPythonDbFile(dbConfig) {
  const d = dbConfig;
  switch (d.type) {
    case 'mysql':
      return `import os\nfrom databases import Database\n\nDATABASE_URL = os.getenv(\n    "DATABASE_URL",\n    f"mysql+aiomysql://{os.getenv('DB_USER','${d.username||'root'}')}:{os.getenv('DB_PASSWORD','')}@{os.getenv('DB_HOST','${d.host||'localhost'}')}:{os.getenv('DB_PORT','${d.port||3306}')}/{os.getenv('DB_NAME','${d.database||'mydb'}'")}"\n)\ndatabase = Database(DATABASE_URL)\n`;
    case 'postgresql':
      return `import os\nfrom databases import Database\n\nDATABASE_URL = os.getenv(\n    "DATABASE_URL",\n    f"postgresql+asyncpg://{os.getenv('DB_USER','${d.username||'postgres'}')}:{os.getenv('DB_PASSWORD','')}@{os.getenv('DB_HOST','${d.host||'localhost'}')}:{os.getenv('DB_PORT','${d.port||5432}')}/{os.getenv('DB_NAME','${d.database||'mydb'}'")}"\n)\ndatabase = Database(DATABASE_URL)\n`;
    case 'sqlite':
      return `import os\nfrom databases import Database\n\nDATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///${d.filePath||'./database.db'}")\ndatabase = Database(DATABASE_URL)\n`;
    case 'mssql':
      return `import os\nimport pyodbc\n\ndef get_connection():\n    server = os.getenv("DB_HOST", "${d.host||'localhost'}")\n    port   = os.getenv("DB_PORT", "${d.port||1433}")\n    db     = os.getenv("DB_NAME", "${d.database||'mydb'}")\n    user   = os.getenv("DB_USER", "${d.username||'sa'}")\n    pwd    = os.getenv("DB_PASSWORD", "")\n    conn_str = (\n        f"DRIVER={{ODBC Driver 17 for SQL Server}};"\n        f"SERVER={server},{port};DATABASE={db};UID={user};PWD={pwd}"\n    )\n    return pyodbc.connect(conn_str)\n`;
    case 'oracle':
      return `import os\nimport cx_Oracle\n\ndef get_connection():\n    user   = os.getenv("DB_USER", "${d.username||'hr'}")\n    pwd    = os.getenv("DB_PASSWORD", "")\n    dsn    = os.getenv("DB_CONNECT_STRING", "${d.host||'localhost'}:${d.port||1521}/${d.serviceName||'XEPDB1'}")\n    return cx_Oracle.connect(user, pwd, dsn)\n`;
    default:
      return `# Unknown database type: ${d.type}\n`;
  }
}

function buildPythonDbEnv(dbConfig) {
  const d = dbConfig;
  const lines = ['# Database Configuration (do not commit this file)'];
  if (d.type === 'sqlite') {
    lines.push(`DATABASE_URL=sqlite+aiosqlite:///${d.filePath||'./database.db'}`);
  } else if (d.type === 'oracle') {
    lines.push(`DB_USER=${d.username||''}`);
    lines.push(`DB_PASSWORD=${d.password||''}`);
    lines.push(`DB_CONNECT_STRING=${d.host||'localhost'}:${d.port||1521}/${d.serviceName||'XEPDB1'}`);
  } else {
    lines.push(`DB_HOST=${d.host||'localhost'}`);
    lines.push(`DB_PORT=${d.port||''}`);
    lines.push(`DB_NAME=${d.database||''}`);
    lines.push(`DB_USER=${d.username||''}`);
    lines.push(`DB_PASSWORD=${d.password||''}`);
  }
  return lines.join('\n');
}

function buildPythonDbRouter(resource, endpoints, dbConfig) {
  const dbType = dbConfig.type;
  const isAsync = PYTHON_ASYNC_DB.includes(dbType);
  const { tableName, pkCol, nonPkNames } = getTableMeta(endpoints, resource);

  let out = `from fastapi import APIRouter, HTTPException\n`;
  if (isAsync) {
    out += `from database import database\n`;
  } else {
    out += `from database import get_connection\n`;
  }
  out += `\nrouter = APIRouter()\n\n`;

  for (const ep of endpoints) {
    const handler = toSnakeHandler(ep.method, ep.path);
    const subPath = ep.path.replace(new RegExp(`^/?${resource}`), '') || '/';
    const fastapiPath = toFastAPIPath(subPath) || '/';
    const pathParams = extractPathParams(ep.path);
    const isByIdPath = ep.path.includes(':');
    const method = ep.method.toUpperCase();
    const asyncKw = isAsync ? 'async ' : '';
    const params = pathParams.map(p => `${p}: int`).join(', ');

    out += `@router.${ep.method.toLowerCase()}("${fastapiPath}"`;
    if (method === 'POST') out += ', status_code=201';
    out += `)\n`;
    out += `${asyncKw}def ${handler}(${params ? params + (nonPkNames.length > 0 && ['POST','PUT','PATCH'].includes(method) ? ', ' : '') : ''}`;

    if (nonPkNames.length > 0 && ['POST', 'PUT', 'PATCH'].includes(method)) {
      // Add individual body params for simplicity
      out += nonPkNames.map(c => `${c}: str = ""`).join(', ');
    }
    out += `):\n`;

    if (isAsync) {
      // databases library approach
      if (method === 'GET' && !isByIdPath) {
        out += `    rows = await database.fetch_all(query="SELECT * FROM ${tableName}")\n`;
        out += `    return rows\n`;
      } else if (method === 'GET') {
        out += `    row = await database.fetch_one(query="SELECT * FROM ${tableName} WHERE ${pkCol} = :${pkCol}", values={"${pkCol}": ${pkCol}})\n`;
        out += `    if not row:\n        raise HTTPException(status_code=404, detail="Not found")\n`;
        out += `    return row\n`;
      } else if (method === 'POST') {
        if (nonPkNames.length > 0) {
          const cols = nonPkNames.join(', ');
          const vals = nonPkNames.map(c => `":${c}"`).join(', ');
          const bindVals = '{' + nonPkNames.map(c => `"${c}": ${c}`).join(', ') + '}';
          out += `    query = "INSERT INTO ${tableName} (${cols}) VALUES (${nonPkNames.map(c=>`:${c}`).join(', ')})"\n`;
          out += `    await database.execute(query=query, values=${bindVals})\n`;
          out += `    return {${nonPkNames.map(c => `"${c}": ${c}`).join(', ')}}\n`;
        } else {
          out += `    return {"message": "Created"}\n`;
        }
      } else if (method === 'PUT' || method === 'PATCH') {
        if (nonPkNames.length > 0) {
          const setClause = nonPkNames.map(c => `${c} = :${c}`).join(', ');
          const bindVals = '{' + [...nonPkNames.map(c => `"${c}": ${c}`), `"${pkCol}": ${pkCol}`].join(', ') + '}';
          out += `    query = "UPDATE ${tableName} SET ${setClause} WHERE ${pkCol} = :${pkCol}"\n`;
          out += `    await database.execute(query=query, values=${bindVals})\n`;
          out += `    return {${nonPkNames.map(c => `"${c}": ${c}`).join(', ')}}\n`;
        } else {
          out += `    return {"message": "Updated"}\n`;
        }
      } else if (method === 'DELETE') {
        out += `    await database.execute(query="DELETE FROM ${tableName} WHERE ${pkCol} = :${pkCol}", values={"${pkCol}": ${pkCol}})\n`;
        out += `    return {"message": "Deleted"}\n`;
      }
    } else {
      // Sync pyodbc/cx_Oracle approach
      const tbl = dbType === 'oracle' ? tableName.toUpperCase() : tableName;
      const pk = dbType === 'oracle' ? pkCol.toUpperCase() : pkCol;
      out += `    conn = get_connection()\n    try:\n        cursor = conn.cursor()\n`;
      if (method === 'GET' && !isByIdPath) {
        out += `        cursor.execute("SELECT * FROM ${tbl}")\n`;
        out += `        columns = [col[0] for col in cursor.description]\n`;
        out += `        return [dict(zip(columns, row)) for row in cursor.fetchall()]\n`;
      } else if (method === 'GET') {
        out += `        cursor.execute("SELECT * FROM ${tbl} WHERE ${pk} = ?", (${pkCol},))\n`;
        out += `        row = cursor.fetchone()\n`;
        out += `        if not row:\n            raise HTTPException(status_code=404, detail="Not found")\n`;
        out += `        columns = [col[0] for col in cursor.description]\n`;
        out += `        return dict(zip(columns, row))\n`;
      } else if (method === 'POST') {
        if (nonPkNames.length > 0) {
          const cols = dbType === 'oracle' ? nonPkNames.map(c=>c.toUpperCase()).join(', ') : nonPkNames.join(', ');
          const ph = nonPkNames.map(() => '?').join(', ');
          out += `        cursor.execute("INSERT INTO ${tbl} (${cols}) VALUES (${ph})", (${nonPkNames.join(', ')},))\n`;
          out += `        conn.commit()\n`;
          out += `        return {${nonPkNames.map(c => `"${c}": ${c}`).join(', ')}}\n`;
        } else {
          out += `        return {"message": "Created"}\n`;
        }
      } else if (method === 'PUT' || method === 'PATCH') {
        if (nonPkNames.length > 0) {
          const setCols = dbType === 'oracle' ? nonPkNames.map(c=>`${c.toUpperCase()} = ?`).join(', ') : nonPkNames.map(c=>`${c} = ?`).join(', ');
          out += `        cursor.execute("UPDATE ${tbl} SET ${setCols} WHERE ${pk} = ?", (${nonPkNames.join(', ')}, ${pkCol}))\n`;
          out += `        conn.commit()\n`;
          out += `        return {${nonPkNames.map(c => `"${c}": ${c}`).join(', ')}}\n`;
        } else {
          out += `        return {"message": "Updated"}\n`;
        }
      } else if (method === 'DELETE') {
        out += `        cursor.execute("DELETE FROM ${tbl} WHERE ${pk} = ?", (${pkCol},))\n`;
        out += `        conn.commit()\n`;
        out += `        return {"message": "Deleted"}\n`;
      }
      out += `    finally:\n        conn.close()\n`;
    }
    out += '\n';
  }
  return out;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

function buildPythonFiles(apis, projectName, version = 'pydantic2', dbConfig = null) {
  const cfg = PYTHON_VERSION_CONFIG[version] || PYTHON_VERSION_CONFIG.pydantic2;
  const files = {};
  const groups = groupByResource(apis);
  const resourceNames = Object.keys(groups);
  const isAsync = dbConfig && PYTHON_ASYNC_DB.includes(dbConfig.type);

  // ── main.py ──
  const dbStartup = dbConfig && isAsync
    ? `\nfrom database import database\n\n@app.on_event("startup")\nasync def startup():\n    await database.connect()\n\n@app.on_event("shutdown")\nasync def shutdown():\n    await database.disconnect()\n`
    : '';
  files['main.py'] = `from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n${resourceNames.map(r => `from routers import ${r}`).join('\n')}\n${dbStartup}\napp = FastAPI(\n    title="${projectName}",\n    version="1.0.0"\n)\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_methods=["*"],\n    allow_headers=["*"],\n)\n\n${resourceNames.map(r => `app.include_router(${r}.router, prefix="/${r}", tags=["${r}"])`).join('\n')}\n\n@app.get("/")\ndef root():\n    return {"message": "${projectName} is running"}\n`;

  // ── requirements.txt ──
  const dbPackages = dbConfig ? (PYTHON_DB_PACKAGES[dbConfig.type] || []) : [];
  files['requirements.txt'] = `# Generated by API Generator — ${cfg.label}\n# Python ${cfg.pythonMin}+ required\n${cfg.fastapi}\n${cfg.uvicorn}\n${cfg.pydantic}\n${dbPackages.join('\n')}\n`;

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

  // ── DB files ──
  if (dbConfig) {
    files['database.py'] = buildPythonDbFile(dbConfig);
    files['.env'] = buildPythonDbEnv(dbConfig);
    files['.gitignore'] = '.env\n__pycache__/\n*.pyc\n';
  }

  // ── __init__.py ──
  files['routers/__init__.py'] = '';
  files['models/__init__.py'] = '';

  for (const [resource, endpoints] of Object.entries(groups)) {

    const hasTableEndpoint = endpoints.some(ep => ep.tableName);

    // Use DB router if dbConfig + table endpoints, otherwise generate normal router
    if (dbConfig && hasTableEndpoint) {
      files[`routers/${resource}.py`] = buildPythonDbRouter(resource, endpoints, dbConfig);
      files[`models/${resource}.py`] = `from pydantic import BaseModel\n${buildTypingImports(cfg)}\n`;
      continue;
    }

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

module.exports = { buildPythonFiles, buildPythonDbFile, buildPythonDbEnv };
