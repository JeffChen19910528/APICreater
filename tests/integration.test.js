/**
 * Integration 測試 — 實際寫檔到磁碟並驗證結構
 */
const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { generateProject } = require(path.join(__dirname, '../generator/codeBuilder'));
const { BASIC_APIS, MULTI_RESOURCE_APIS } = require('./fixtures/sampleApis');

// 臨時輸出目錄
const TMP_BASE = path.join(os.tmpdir(), 'api-generator-test-' + Date.now());

function cleanup() {
  try { fs.rmSync(TMP_BASE, { recursive: true, force: true }); } catch {}
}

after(() => cleanup());

// ─── 工具 ─────────────────────────────────────────────────────────────────────

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf-8'); }

// ─── Node.js Integration ──────────────────────────────────────────────────────

describe('Integration — Node.js 寫檔測試', () => {

  it('應在磁碟建立完整專案結構', async () => {
    const outDir = path.join(TMP_BASE, 'nodejs-test');
    await generateProject({ apis: BASIC_APIS, projectName: 'nodejs-test', language: 'nodejs', version: 'express4', outputDir: outDir });

    assert.ok(exists(outDir), '輸出目錄應存在');
    assert.ok(exists(path.join(outDir, 'app.js')), 'app.js');
    assert.ok(exists(path.join(outDir, 'package.json')), 'package.json');
    assert.ok(exists(path.join(outDir, 'README.md')), 'README.md');
    assert.ok(exists(path.join(outDir, 'routes', 'usersRoute.js')), 'routes/usersRoute.js');
    assert.ok(exists(path.join(outDir, 'controllers', 'usersController.js')), 'controllers/usersController.js');
    assert.ok(exists(path.join(outDir, 'models', 'usersModel.js')), 'models/usersModel.js');
  });

  it('寫出的 package.json 應可被正確 parse', async () => {
    const outDir = path.join(TMP_BASE, 'nodejs-pkg');
    await generateProject({ apis: BASIC_APIS, projectName: 'nodejs-pkg', language: 'nodejs', version: 'express4', outputDir: outDir });

    const pkg = JSON.parse(read(path.join(outDir, 'package.json')));
    assert.equal(pkg.name, 'nodejs-pkg');
    assert.ok(pkg.dependencies.express);
    assert.ok(pkg.scripts.start);
  });

  it('多資源應建立對應的多個目錄檔案', async () => {
    const outDir = path.join(TMP_BASE, 'nodejs-multi');
    await generateProject({ apis: MULTI_RESOURCE_APIS, projectName: 'nodejs-multi', language: 'nodejs', version: 'express4', outputDir: outDir });

    assert.ok(exists(path.join(outDir, 'routes', 'usersRoute.js')));
    assert.ok(exists(path.join(outDir, 'routes', 'productsRoute.js')));
    assert.ok(exists(path.join(outDir, 'controllers', 'usersController.js')));
    assert.ok(exists(path.join(outDir, 'controllers', 'productsController.js')));
  });

  it('不應有空白檔案', async () => {
    const outDir = path.join(TMP_BASE, 'nodejs-nonempty');
    await generateProject({ apis: BASIC_APIS, projectName: 'nodejs-nonempty', language: 'nodejs', version: 'express4', outputDir: outDir });

    const files = ['app.js', 'package.json', 'routes/usersRoute.js', 'controllers/usersController.js'];
    for (const f of files) {
      const content = read(path.join(outDir, f));
      assert.ok(content.trim().length > 0, `${f} 不應為空白`);
    }
  });
});

// ─── Python Integration ───────────────────────────────────────────────────────

describe('Integration — Python 寫檔測試', () => {

  it('應在磁碟建立完整 Python 專案結構', async () => {
    const outDir = path.join(TMP_BASE, 'python-test');
    await generateProject({ apis: BASIC_APIS, projectName: 'python-test', language: 'python', version: 'pydantic2', outputDir: outDir });

    assert.ok(exists(outDir), '輸出目錄應存在');
    assert.ok(exists(path.join(outDir, 'main.py')), 'main.py');
    assert.ok(exists(path.join(outDir, 'requirements.txt')), 'requirements.txt');
    assert.ok(exists(path.join(outDir, 'README.md')), 'README.md');
    assert.ok(exists(path.join(outDir, 'routers', '__init__.py')), 'routers/__init__.py');
    assert.ok(exists(path.join(outDir, 'routers', 'users.py')), 'routers/users.py');
    assert.ok(exists(path.join(outDir, 'models', '__init__.py')), 'models/__init__.py');
    assert.ok(exists(path.join(outDir, 'models', 'users.py')), 'models/users.py');
  });

  it('requirements.txt 應為有效格式', async () => {
    const outDir = path.join(TMP_BASE, 'python-req');
    await generateProject({ apis: BASIC_APIS, projectName: 'python-req', language: 'python', version: 'pydantic2', outputDir: outDir });

    const req = read(path.join(outDir, 'requirements.txt'));
    const lines = req.trim().split('\n').filter(l => l.trim());
    assert.ok(lines.length >= 3, '應至少有 3 個套件');
    lines.forEach(line => {
      assert.ok(/\w+/.test(line), `每行應有套件名稱: ${line}`);
    });
  });

  it('routers/users.py 應包含有效 Python 語法標誌', async () => {
    const outDir = path.join(TMP_BASE, 'python-syntax');
    await generateProject({ apis: BASIC_APIS, projectName: 'python-syntax', language: 'python', version: 'pydantic2', outputDir: outDir });

    const router = read(path.join(outDir, 'routers', 'users.py'));
    assert.ok(router.includes('def '), '應有函式定義');
    assert.ok(router.includes('@router.'), '應有 router decorator');
    assert.ok(!router.includes('undefined'), '不應有 undefined');
  });
});

// ─── C# Integration ───────────────────────────────────────────────────────────

describe('Integration — C# 寫檔測試', () => {

  it('應在磁碟建立完整 C# 專案結構', async () => {
    const outDir = path.join(TMP_BASE, 'csharp-test');
    await generateProject({ apis: BASIC_APIS, projectName: 'CsharpTest', language: 'csharp', version: 'net8', outputDir: outDir });

    assert.ok(exists(outDir), '輸出目錄應存在');
    assert.ok(exists(path.join(outDir, 'Program.cs')), 'Program.cs');
    assert.ok(exists(path.join(outDir, 'appsettings.json')), 'appsettings.json');
    assert.ok(exists(path.join(outDir, 'README.md')), 'README.md');
    assert.ok(exists(path.join(outDir, 'Controllers', 'UsersController.cs')), 'Controllers/UsersController.cs');
    assert.ok(exists(path.join(outDir, 'Models', 'UsersModels.cs')), 'Models/UsersModels.cs');

    // 驗證 .csproj 存在（名稱依專案而定）
    const csprojFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.csproj'));
    assert.ok(csprojFiles.length > 0, '.csproj 應存在');
  });

  it('appsettings.json 應為有效 JSON', async () => {
    const outDir = path.join(TMP_BASE, 'csharp-json');
    await generateProject({ apis: BASIC_APIS, projectName: 'CsharpJson', language: 'csharp', version: 'net8', outputDir: outDir });

    assert.doesNotThrow(() => {
      JSON.parse(read(path.join(outDir, 'appsettings.json')));
    }, 'appsettings.json 應為有效 JSON');
  });

  it('Controller 應包含有效 C# 語法標誌', async () => {
    const outDir = path.join(TMP_BASE, 'csharp-syntax');
    await generateProject({ apis: BASIC_APIS, projectName: 'CsharpSyntax', language: 'csharp', version: 'net8', outputDir: outDir });

    const ctrl = read(path.join(outDir, 'Controllers', 'UsersController.cs'));
    assert.ok(ctrl.includes('public class'), '應有 public class');
    assert.ok(ctrl.includes('public IActionResult'), '應有 IActionResult 方法');
    assert.ok(!ctrl.includes('undefined'), '不應有 undefined');
    assert.ok(!ctrl.includes('null\n    }'), '不應有裸 null 回傳');
  });

  it('多資源應建立多個 Controller 和 Model 檔案', async () => {
    const outDir = path.join(TMP_BASE, 'csharp-multi');
    await generateProject({ apis: MULTI_RESOURCE_APIS, projectName: 'CsharpMulti', language: 'csharp', version: 'net8', outputDir: outDir });

    assert.ok(exists(path.join(outDir, 'Controllers', 'UsersController.cs')));
    assert.ok(exists(path.join(outDir, 'Controllers', 'ProductsController.cs')));
    assert.ok(exists(path.join(outDir, 'Models', 'UsersModels.cs')));
    assert.ok(exists(path.join(outDir, 'Models', 'ProductsModels.cs')));
  });
});

// ─── 語言分派測試 ─────────────────────────────────────────────────────────────

describe('Integration — 語言分派', () => {

  it('未知語言應 fallback 到 Node.js', async () => {
    const outDir = path.join(TMP_BASE, 'unknown-lang');
    await generateProject({ apis: BASIC_APIS, projectName: 'unknown-lang', language: 'unknown', version: 'express4', outputDir: outDir });
    assert.ok(exists(path.join(outDir, 'app.js')), 'fallback 應產生 app.js');
  });

  it('同一組 API 三種語言應產生不同結構', async () => {
    const nodeDir = path.join(TMP_BASE, 'lang-node');
    const pyDir   = path.join(TMP_BASE, 'lang-py');
    const csDir   = path.join(TMP_BASE, 'lang-cs');

    await generateProject({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express4', outputDir: nodeDir });
    await generateProject({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic2', outputDir: pyDir });
    await generateProject({ apis: BASIC_APIS, projectName: 'test', language: 'csharp', version: 'net8', outputDir: csDir });

    assert.ok(exists(path.join(nodeDir, 'app.js')), 'Node.js → app.js');
    assert.ok(exists(path.join(pyDir, 'main.py')), 'Python → main.py');
    assert.ok(exists(path.join(csDir, 'Program.cs')), 'C# → Program.cs');

    assert.ok(!exists(path.join(pyDir, 'app.js')), 'Python 不應有 app.js');
    assert.ok(!exists(path.join(csDir, 'main.py')), 'C# 不應有 main.py');
    assert.ok(!exists(path.join(nodeDir, 'main.py')), 'Node.js 不應有 main.py');
  });
});
