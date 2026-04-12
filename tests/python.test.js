/**
 * Python FastAPI Generator 測試
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { BASIC_APIS, MULTI_RESOURCE_APIS, ALL_TYPES_APIS, EMPTY_SCHEMA_APIS, NESTED_SCHEMA_APIS } = require('./fixtures/sampleApis');
const { generatePreview } = require(path.join(__dirname, '../generator/codeBuilder'));

async function getFiles(apis, projectName = 'test-project') {
  return generatePreview({ apis, projectName, language: 'python', version: 'pydantic2' });
}

// ─── 測試套件 ──────────────────────────────────────────────────────────────────

describe('Python Generator — 基本結構', () => {

  it('應產生 main.py', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['main.py'], 'main.py 應存在');
    assert.ok(files['main.py'].includes('from fastapi import FastAPI'), 'main.py 應引入 FastAPI');
    assert.ok(files['main.py'].includes('app = FastAPI'), '應建立 FastAPI app');
    assert.ok(files['main.py'].includes('app.include_router'), '應掛載 router');
  });

  it('main.py 應包含專案名稱', async () => {
    const files = await getFiles(BASIC_APIS, 'my-python-api');
    assert.ok(files['main.py'].includes('my-python-api'), '應包含專案名稱');
  });

  it('應產生 requirements.txt 且包含必要套件', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['requirements.txt'], 'requirements.txt 應存在');
    assert.ok(files['requirements.txt'].includes('fastapi'), 'fastapi 套件');
    assert.ok(files['requirements.txt'].includes('uvicorn'), 'uvicorn 套件');
    assert.ok(files['requirements.txt'].includes('pydantic'), 'pydantic 套件');
  });

  it('應產生 __init__.py（routers 和 models）', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok('routers/__init__.py' in files, 'routers/__init__.py 應存在');
    assert.ok('models/__init__.py' in files, 'models/__init__.py 應存在');
  });

  it('應產生 README.md 且包含 uvicorn 啟動指令', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['README.md'], 'README.md 應存在');
    assert.ok(files['README.md'].includes('uvicorn'), '應包含 uvicorn 指令');
    assert.ok(files['README.md'].includes('requirements.txt'), '應包含安裝說明');
  });
});

describe('Python Generator — Router 檔案', () => {

  it('應產生 routers/users.py', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['routers/users.py'], 'routers/users.py 應存在');
  });

  it('router 應包含 APIRouter', async () => {
    const files = await getFiles(BASIC_APIS);
    const router = files['routers/users.py'];
    assert.ok(router.includes('from fastapi import APIRouter'), '應引入 APIRouter');
    assert.ok(router.includes('router = APIRouter()'), '應建立 router 實例');
  });

  it('router 應包含正確的 HTTP method decorators', async () => {
    const files = await getFiles(BASIC_APIS);
    const router = files['routers/users.py'];
    assert.ok(router.includes('@router.get'), '應有 GET decorator');
    assert.ok(router.includes('@router.post'), '應有 POST decorator');
    assert.ok(router.includes('@router.put'), '應有 PUT decorator');
    assert.ok(router.includes('@router.delete'), '應有 DELETE decorator');
  });

  it('main.py 應 include users router 並設定 prefix', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['main.py'].includes('from routers import users'), '應匯入 users router');
    assert.ok(files['main.py'].includes("prefix=\"/users\""), '應設定 /users prefix');
  });
});

describe('Python Generator — Path Params', () => {

  it(':id 應轉換為 FastAPI 格式 {id}', async () => {
    const files = await getFiles(BASIC_APIS);
    const router = files['routers/users.py'];
    assert.ok(router.includes('{id}'), ':id 應轉換為 {id}');
  });

  it('path param 應出現在函式參數中', async () => {
    const files = await getFiles(BASIC_APIS);
    const router = files['routers/users.py'];
    assert.ok(router.includes('id: str'), 'id param 應在函式簽名中');
  });
});

describe('Python Generator — Pydantic Models', () => {

  it('應產生 models/users.py', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['models/users.py'], 'models/users.py 應存在');
  });

  it('model 應引入 BaseModel', async () => {
    const files = await getFiles(BASIC_APIS);
    const model = files['models/users.py'];
    assert.ok(model.includes('from pydantic import BaseModel'), '應引入 BaseModel');
  });

  it('model 應繼承 BaseModel', async () => {
    const files = await getFiles(BASIC_APIS);
    const model = files['models/users.py'];
    assert.ok(model.includes('(BaseModel):'), '應繼承 BaseModel');
  });
});

describe('Python Generator — 型別對應', () => {

  it('應正確對應 Python 型別', async () => {
    const files = await getFiles(ALL_TYPES_APIS);
    const model = files['models/items.py'];
    assert.ok(model.includes('str'), 'string → str');
    assert.ok(model.includes('int'), 'int → int');
    assert.ok(model.includes('float'), 'number → float');
    assert.ok(model.includes('bool'), 'boolean → bool');
    assert.ok(model.includes('list[Any]') || model.includes('List[Any]'), 'array → list/List');
  });

  it('Python sample 值應正確', async () => {
    const files = await getFiles(ALL_TYPES_APIS);
    const router = files['routers/items.py'];
    assert.ok(router.includes('"example"'), 'string sample');
    assert.ok(router.includes('True'), 'boolean sample → True（大寫）');
    assert.ok(router.includes('[]'), 'array sample → []');
  });
});

describe('Python Generator — 多資源', () => {

  it('應為每個資源產生獨立 router 和 model', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    assert.ok(files['routers/users.py'], 'users router');
    assert.ok(files['routers/products.py'], 'products router');
    assert.ok(files['models/users.py'], 'users model');
    assert.ok(files['models/products.py'], 'products model');
  });

  it('main.py 應 include 所有資源的 router', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    assert.ok(files['main.py'].includes('from routers import users'), 'users import');
    assert.ok(files['main.py'].includes('from routers import products'), 'products import');
    assert.ok(files['main.py'].includes('prefix="/users"'), 'users prefix');
    assert.ok(files['main.py'].includes('prefix="/products"'), 'products prefix');
  });
});

describe('Python Generator — 空 Schema', () => {

  it('空 schema 不應報錯', async () => {
    const result = await generatePreview({ apis: EMPTY_SCHEMA_APIS, projectName: 'health', language: 'python', version: 'pydantic2' });
    assert.ok(result['main.py'], 'main.py 應存在');
    assert.ok(result['routers/health.py'], 'health router 應存在');
  });

  it('空 API 陣列不應報錯', async () => {
    const result = await generatePreview({ apis: [], projectName: 'empty', language: 'python', version: 'pydantic2' });
    assert.ok(result['main.py'], 'main.py 應存在');
  });
});

describe('Python Generator — CORS 設定', () => {

  it('main.py 應包含 CORS middleware', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['main.py'].includes('CORSMiddleware'), '應包含 CORS middleware');
    assert.ok(files['main.py'].includes('allow_origins'), '應設定 allow_origins');
  });
});
