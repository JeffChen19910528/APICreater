/**
 * 版本差異測試
 * 確保每個版本產生正確的版本特定內容
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { generatePreview } = require(path.join(__dirname, '../generator/codeBuilder'));
const { BASIC_APIS, ALL_TYPES_APIS } = require('./fixtures/sampleApis');

// ─── Node.js 版本差異 ─────────────────────────────────────────────────────────

describe('Node.js 版本差異 — Express 4 vs 5', () => {

  it('Express 4: package.json 應鎖定 ^4.x 且 engines>=14', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express4' });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies.express.startsWith('^4'), `Express 版本應為 4.x，實際：${pkg.dependencies.express}`);
    assert.ok(pkg.engines.node.includes('14'), `Node.js engine 應為 >=14，實際：${pkg.engines.node}`);
  });

  it('Express 5: package.json 應鎖定 ^5.x 且 engines>=18', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express5' });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies.express.startsWith('^5'), `Express 版本應為 5.x，實際：${pkg.dependencies.express}`);
    assert.ok(pkg.engines.node.includes('18'), `Node.js engine 應為 >=18，實際：${pkg.engines.node}`);
  });

  it('Express 4 和 5 的 app.js 應相同（相容 API）', async () => {
    const v4 = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express4' });
    const v5 = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express5' });
    assert.equal(v4['app.js'], v5['app.js'], 'app.js 在兩版本應相同');
    assert.equal(v4['routes/usersRoute.js'], v5['routes/usersRoute.js'], 'route 在兩版本應相同');
  });

  it('Express 4 README 應提及 Express 4.x', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express4' });
    assert.ok(files['README.md'].includes('Express 4.x'), 'README 應提及 Express 4.x');
  });

  it('Express 5 README 應提及 Express 5.x', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'nodejs', version: 'express5' });
    assert.ok(files['README.md'].includes('Express 5.x'), 'README 應提及 Express 5.x');
  });
});

// ─── Python 版本差異 ──────────────────────────────────────────────────────────

describe('Python 版本差異 — Pydantic v1 vs v2', () => {

  it('pydantic2: requirements.txt 應包含 pydantic>=2.0.0', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic2' });
    assert.ok(files['requirements.txt'].includes('pydantic>=2.0.0'), 'pydantic2 版本要求');
    assert.ok(files['requirements.txt'].includes('fastapi>=0.115.0'), 'fastapi 版本要求');
  });

  it('pydantic1: requirements.txt 應包含 pydantic>=1.10 且 <2.0', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic1' });
    const req = files['requirements.txt'];
    assert.ok(req.includes('pydantic>=1.10.0'), 'pydantic v1 版本');
    assert.ok(req.includes('<2.0.0'), 'pydantic 上限');
    assert.ok(req.includes('fastapi>=0.95.0'), 'fastapi 版本');
  });

  it('legacy: requirements.txt 應包含 pydantic>=1.6 且舊版 uvicorn', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'legacy' });
    const req = files['requirements.txt'];
    assert.ok(req.includes('fastapi>=0.68.0'), 'fastapi 舊版');
    assert.ok(req.includes('pydantic>=1.6.0'), 'pydantic 版本');
    assert.ok(!req.includes('uvicorn[standard]') || req.includes('uvicorn>=0.17.0'), 'uvicorn 版本');
  });

  it('pydantic2: model 不應有 class Config', async () => {
    const files = await generatePreview({ apis: ALL_TYPES_APIS, projectName: 'test', language: 'python', version: 'pydantic2' });
    const model = files['models/items.py'];
    assert.ok(!model.includes('class Config'), 'Pydantic v2 不應有 class Config');
  });

  it('pydantic1: model 應有 class Config 和 orm_mode', async () => {
    const files = await generatePreview({ apis: ALL_TYPES_APIS, projectName: 'test', language: 'python', version: 'pydantic1' });
    const model = files['models/items.py'];
    assert.ok(model.includes('class Config'), 'Pydantic v1 應有 class Config');
    assert.ok(model.includes('orm_mode = True'), 'Pydantic v1 應有 orm_mode');
  });

  it('legacy: model 應有 class Config', async () => {
    const files = await generatePreview({ apis: ALL_TYPES_APIS, projectName: 'test', language: 'python', version: 'legacy' });
    const model = files['models/items.py'];
    assert.ok(model.includes('class Config'), 'legacy 應有 class Config');
  });

  it('pydantic2: router 應使用 async def', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic2' });
    const router = files['routers/users.py'];
    assert.ok(router.includes('async def'), 'pydantic2 應使用 async def');
  });

  it('pydantic1: router 應使用 def（非 async）', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic1' });
    const router = files['routers/users.py'];
    // pydantic1 should NOT have async def
    assert.ok(!router.includes('async def'), 'pydantic1 不應使用 async def');
    assert.ok(router.includes('\ndef '), 'pydantic1 應使用 def');
  });

  it('pydantic1 typing imports 應包含 Optional', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic1' });
    const model = files['models/users.py'];
    assert.ok(model.includes('Optional'), 'pydantic1 應引入 Optional');
  });

  it('README 應包含對應的 Python 版本需求', async () => {
    const v2 = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic2' });
    const v1 = await generatePreview({ apis: BASIC_APIS, projectName: 'test', language: 'python', version: 'pydantic1' });
    assert.ok(v2['README.md'].includes('3.10'), 'pydantic2 README 應提及 Python 3.10+');
    assert.ok(v1['README.md'].includes('3.8'), 'pydantic1 README 應提及 Python 3.8+');
  });
});

// ─── C# 版本差異 ──────────────────────────────────────────────────────────────

describe('C# 版本差異 — Minimal Hosting vs Startup.cs', () => {

  it('net8: .csproj 應為 net8.0', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net8' });
    const csproj = Object.entries(files).find(([k]) => k.endsWith('.csproj'));
    assert.ok(csproj, '.csproj 應存在');
    assert.ok(csproj[1].includes('net8.0'), 'target framework 應為 net8.0');
    assert.ok(csproj[1].includes('6.5.0'), 'Swashbuckle 應為 6.5.0');
  });

  it('net6: .csproj 應為 net6.0', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net6' });
    const csproj = Object.entries(files).find(([k]) => k.endsWith('.csproj'));
    assert.ok(csproj[1].includes('net6.0'), 'target framework 應為 net6.0');
    assert.ok(csproj[1].includes('6.4.0'), 'Swashbuckle 應為 6.4.0');
  });

  it('net5: .csproj 應為 net5.0', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net5' });
    const csproj = Object.entries(files).find(([k]) => k.endsWith('.csproj'));
    assert.ok(csproj[1].includes('net5.0'), 'target framework 應為 net5.0');
    assert.ok(csproj[1].includes('5.6.3'), 'Swashbuckle 應為 5.6.3');
  });

  it('net31: .csproj 應為 netcoreapp3.1', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net31' });
    const csproj = Object.entries(files).find(([k]) => k.endsWith('.csproj'));
    assert.ok(csproj[1].includes('netcoreapp3.1'), 'target framework 應為 netcoreapp3.1');
  });

  it('net8/net6/net5: 使用 Minimal Hosting（Program.cs 不含 Startup）', async () => {
    for (const v of ['net8', 'net6', 'net5']) {
      const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: v });
      assert.ok(files['Program.cs'].includes('WebApplication.CreateBuilder'), `${v} 應使用 minimal hosting`);
      assert.ok(!files['Startup.cs'], `${v} 不應有 Startup.cs`);
    }
  });

  it('net31: 使用 Startup.cs 模式', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net31' });
    assert.ok(files['Startup.cs'], 'net31 應有 Startup.cs');
    assert.ok(files['Startup.cs'].includes('ConfigureServices'), 'Startup.cs 應有 ConfigureServices');
    assert.ok(files['Startup.cs'].includes('Configure('), 'Startup.cs 應有 Configure 方法');
    assert.ok(files['Program.cs'].includes('CreateHostBuilder'), 'net31 Program.cs 應有 CreateHostBuilder');
    assert.ok(!files['Program.cs'].includes('WebApplication.CreateBuilder'), 'net31 不應有 minimal hosting');
  });

  it('net8 README 應提及 .NET 8', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net8' });
    assert.ok(files['README.md'].includes('.NET 8') || files['README.md'].includes('8.0'), 'README 應提及 .NET 8');
  });

  it('net31 README 應提及 .NET Core 3.1', async () => {
    const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net31' });
    assert.ok(files['README.md'].includes('3.1') || files['README.md'].includes('Core 3'), 'README 應提及 .NET Core 3.1');
  });

  it('Controller 程式碼在所有版本應相同（邏輯不變）', async () => {
    const net8 = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net8' });
    const net31 = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: 'net31' });
    // Both should have [HttpGet] attribute
    assert.ok(net8['Controllers/UsersController.cs'].includes('[HttpGet'), 'net8 controller');
    assert.ok(net31['Controllers/UsersController.cs'].includes('[HttpGet'), 'net31 controller');
    assert.ok(net8['Controllers/UsersController.cs'].includes('IActionResult'), 'net8 IActionResult');
    assert.ok(net31['Controllers/UsersController.cs'].includes('IActionResult'), 'net31 IActionResult');
  });

  it('net8/net6 應包含 AddEndpointsApiExplorer', async () => {
    for (const v of ['net8', 'net6']) {
      const files = await generatePreview({ apis: BASIC_APIS, projectName: 'Test', language: 'csharp', version: v });
      assert.ok(files['Program.cs'].includes('AddEndpointsApiExplorer'), `${v} 應有 AddEndpointsApiExplorer`);
    }
  });
});
