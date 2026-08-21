/**
 * Node.js Express Generator 測試
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { BASIC_APIS, MULTI_RESOURCE_APIS, NESTED_SCHEMA_APIS, ALL_TYPES_APIS, EMPTY_SCHEMA_APIS } = require('./fixtures/sampleApis');

// 直接測試 Node.js builder（從 codeBuilder 中取得）
const { generatePreview } = require(path.join(__dirname, '../src/generator/codeBuilder'));

// ─── 工具 ─────────────────────────────────────────────────────────────────────

async function getFiles(apis, projectName = 'test-project') {
  return generatePreview({ apis, projectName, language: 'nodejs', version: 'express4' });
}

// ─── 測試套件 ──────────────────────────────────────────────────────────────────

describe('Node.js Generator — 基本 CRUD', () => {

  it('應產生 app.js', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['app.js'], 'app.js 應存在');
    assert.ok(files['app.js'].includes("require('express')"), 'app.js 應引入 express');
    assert.ok(files['app.js'].includes('app.listen'), 'app.js 應包含 listen');
    assert.ok(files['app.js'].includes('test-project'), 'app.js 應包含專案名稱');
  });

  it('應產生 package.json 且包含 express 依賴', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['package.json'], 'package.json 應存在');
    const pkg = JSON.parse(files['package.json']);
    assert.equal(pkg.name, 'test-project');
    assert.ok(pkg.dependencies.express, '應包含 express 依賴');
    assert.ok(pkg.scripts.start, '應包含 start script');
  });

  it('應產生 README.md', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['README.md'], 'README.md 應存在');
    assert.ok(files['README.md'].includes('test-project'));
    assert.ok(files['README.md'].includes('npm install'));
  });

  it('應依資源分組產生 route 檔案', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['routes/usersRoute.js'], 'users route 應存在');
    const route = files['routes/usersRoute.js'];
    assert.ok(route.includes("require('express')"), 'route 應引入 express');
    assert.ok(route.includes('router.get'), '應包含 GET 方法');
    assert.ok(route.includes('router.post'), '應包含 POST 方法');
    assert.ok(route.includes('router.put'), '應包含 PUT 方法');
    assert.ok(route.includes('router.delete'), '應包含 DELETE 方法');
  });

  it('應產生 controller 檔案且含處理函式', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['controllers/usersController.js'], 'users controller 應存在');
    const ctrl = files['controllers/usersController.js'];
    assert.ok(ctrl.includes('exports.'), 'controller 應有 exports');
    assert.ok(ctrl.includes('res.json'), 'controller 應回傳 JSON');
  });

  it('應產生 model 檔案', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['models/usersModel.js'], 'users model 應存在');
    assert.ok(files['models/usersModel.js'].includes('// Model: users'));
  });

  it('app.js 應掛載 users 路由', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['app.js'].includes("require('./routes/usersRoute')"), '應掛載 users route');
    assert.ok(files['app.js'].includes("app.use('/users'"), '應使用 /users 前綴');
  });
});

describe('Node.js Generator — Path Params', () => {

  it('路由應正確處理 :id 路徑參數', async () => {
    const files = await getFiles(BASIC_APIS);
    const route = files['routes/usersRoute.js'];
    assert.ok(route.includes('/:id') || route.includes("'/:id'") || route.includes('"/:id"'), '應包含 :id 路由');
  });

  it('controller handler 名稱應反映路徑結構', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['controllers/usersController.js'];
    // GET /users → get, GET /users/:id → getById
    assert.ok(ctrl.includes('exports.get'), 'GET handler 應存在');
    assert.ok(ctrl.includes('ById') || ctrl.includes('id'), 'path param handler 應存在');
  });
});

describe('Node.js Generator — 多資源', () => {

  it('應為每個資源產生獨立的 route / controller / model', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    assert.ok(files['routes/usersRoute.js'], 'users route 應存在');
    assert.ok(files['routes/productsRoute.js'], 'products route 應存在');
    assert.ok(files['controllers/usersController.js'], 'users controller 應存在');
    assert.ok(files['controllers/productsController.js'], 'products controller 應存在');
    assert.ok(files['models/usersModel.js'], 'users model 應存在');
    assert.ok(files['models/productsModel.js'], 'products model 應存在');
  });

  it('app.js 應掛載所有資源的路由', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    assert.ok(files['app.js'].includes('/users'), '應掛載 /users');
    assert.ok(files['app.js'].includes('/products'), '應掛載 /products');
  });
});

describe('Node.js Generator — Schema 型別對應', () => {

  it('response schema 應轉換為正確的 sample 值', async () => {
    const files = await getFiles(ALL_TYPES_APIS);
    const ctrl = files['controllers/itemsController.js'];
    assert.ok(ctrl.includes('"example"'), 'string → "example"');
    assert.ok(ctrl.includes('0'), 'int/number → 0');
    assert.ok(ctrl.includes('true'), 'boolean → true');
    assert.ok(ctrl.includes('[]'), 'array → []');
  });
});

describe('Node.js Generator — 空 Schema', () => {

  it('空 schema 不應報錯，應正常產生檔案', async () => {
    let files;
    assert.doesNotThrow(() => {
      files = generatePreview({ apis: EMPTY_SCHEMA_APIS, projectName: 'health-api', language: 'nodejs', version: 'express4' });
    });
    const result = await files;
    assert.ok(result['app.js'], 'app.js 應存在');
    assert.ok(result['routes/healthRoute.js'], 'health route 應存在');
  });

  it('空 API 陣列不應報錯', async () => {
    const result = await generatePreview({ apis: [], projectName: 'empty', language: 'nodejs', version: 'express4' });
    assert.ok(result['app.js'], 'app.js 應存在');
    const pkg = JSON.parse(result['package.json']);
    assert.equal(pkg.name, 'empty');
  });
});

describe('Node.js Generator — HTTP Methods', () => {

  it('應支援 GET / POST / PUT / DELETE / PATCH 所有 methods', async () => {
    const apis = [
      { id: 1, method: 'GET',    path: '/items',    requestSchema: {}, responseSchema: { id: 'int' } },
      { id: 2, method: 'POST',   path: '/items',    requestSchema: { name: 'string' }, responseSchema: { id: 'int' } },
      { id: 3, method: 'PUT',    path: '/items/:id', requestSchema: { name: 'string' }, responseSchema: { id: 'int' } },
      { id: 4, method: 'DELETE', path: '/items/:id', requestSchema: {}, responseSchema: { message: 'string' } },
      { id: 5, method: 'PATCH',  path: '/items/:id', requestSchema: { name: 'string' }, responseSchema: { id: 'int' } }
    ];
    const files = await getFiles(apis, 'methods-test');
    const route = files['routes/itemsRoute.js'];
    assert.ok(route.includes('router.get'), 'GET');
    assert.ok(route.includes('router.post'), 'POST');
    assert.ok(route.includes('router.put'), 'PUT');
    assert.ok(route.includes('router.delete'), 'DELETE');
    assert.ok(route.includes('router.patch'), 'PATCH');
  });
});
