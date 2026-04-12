/**
 * C# ASP.NET Core Generator 測試
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { BASIC_APIS, MULTI_RESOURCE_APIS, ALL_TYPES_APIS, EMPTY_SCHEMA_APIS, PATCH_APIS } = require('./fixtures/sampleApis');
const { generatePreview } = require(path.join(__dirname, '../generator/codeBuilder'));

async function getFiles(apis, projectName = 'TestProject') {
  return generatePreview({ apis, projectName, language: 'csharp', version: 'net8' });
}

// ─── 測試套件 ──────────────────────────────────────────────────────────────────

describe('C# Generator — 基本結構', () => {

  it('應產生 Program.cs', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['Program.cs'], 'Program.cs 應存在');
    assert.ok(files['Program.cs'].includes('WebApplication.CreateBuilder'), '應建立 WebApplication');
    assert.ok(files['Program.cs'].includes('AddControllers'), '應加入 Controllers');
    assert.ok(files['Program.cs'].includes('MapControllers'), '應 MapControllers');
  });

  it('應產生 .csproj 檔案', async () => {
    const files = await getFiles(BASIC_APIS, 'TestProject');
    const csprojKey = Object.keys(files).find(k => k.endsWith('.csproj'));
    assert.ok(csprojKey, '.csproj 應存在');
    const csproj = files[csprojKey];
    assert.ok(csproj.includes('net8.0'), '應以 net8.0 為目標');
    assert.ok(csproj.includes('Microsoft.NET.Sdk.Web'), '應使用 Web SDK');
  });

  it('應產生 appsettings.json', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['appsettings.json'], 'appsettings.json 應存在');
    const settings = JSON.parse(files['appsettings.json']);
    assert.ok(settings.Logging, '應有 Logging 設定');
    assert.ok(settings.AllowedHosts, '應有 AllowedHosts');
  });

  it('Program.cs 應設定 Swagger', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['Program.cs'].includes('AddSwaggerGen'), '應加入 SwaggerGen');
    assert.ok(files['Program.cs'].includes('UseSwagger'), '應使用 Swagger');
    assert.ok(files['Program.cs'].includes('UseSwaggerUI'), '應使用 SwaggerUI');
  });

  it('應產生 README.md 且包含 dotnet 指令', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['README.md'], 'README.md 應存在');
    assert.ok(files['README.md'].includes('dotnet restore'), '應包含 dotnet restore');
    assert.ok(files['README.md'].includes('dotnet run'), '應包含 dotnet run');
  });
});

describe('C# Generator — Controller', () => {

  it('應產生 Controllers/UsersController.cs', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['Controllers/UsersController.cs'], 'UsersController.cs 應存在');
  });

  it('controller 應有正確的 attributes', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('[ApiController]'), '應有 [ApiController]');
    assert.ok(ctrl.includes('[Route("[controller]")]'), '應有 Route attribute');
    assert.ok(ctrl.includes(': ControllerBase'), '應繼承 ControllerBase');
  });

  it('controller 應有正確的 HTTP method attributes', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('[HttpGet'), '應有 HttpGet');
    assert.ok(ctrl.includes('[HttpPost'), '應有 HttpPost');
    assert.ok(ctrl.includes('[HttpPut'), '應有 HttpPut');
    assert.ok(ctrl.includes('[HttpDelete'), '應有 HttpDelete');
  });

  it('controller namespace 應正確', async () => {
    const files = await getFiles(BASIC_APIS, 'MyApi');
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('namespace'), '應有 namespace');
    assert.ok(ctrl.includes('Controllers'), 'namespace 應包含 Controllers');
  });

  it('action 應回傳 IActionResult', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('IActionResult'), '應回傳 IActionResult');
    assert.ok(ctrl.includes('return Ok('), '應使用 Ok()');
  });
});

describe('C# Generator — Path Params', () => {

  it(':id 應轉換為 ASP.NET 格式 {id}', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('{id}'), ':id 應轉換為 {id}');
  });

  it('path param 應使用 [FromRoute]', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('[FromRoute]'), '應有 [FromRoute] attribute');
  });

  it('POST body 應使用 [FromBody]', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('[FromBody]'), '應有 [FromBody] attribute');
  });
});

describe('C# Generator — Models', () => {

  it('應產生 Models/UsersModels.cs', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['Models/UsersModels.cs'], 'UsersModels.cs 應存在');
  });

  it('model namespace 應正確', async () => {
    const files = await getFiles(BASIC_APIS, 'MyApi');
    const model = files['Models/UsersModels.cs'];
    assert.ok(model.includes('namespace'), '應有 namespace');
    assert.ok(model.includes('Models'), 'namespace 應包含 Models');
  });

  it('model 應有 public class', async () => {
    const files = await getFiles(BASIC_APIS);
    const model = files['Models/UsersModels.cs'];
    assert.ok(model.includes('public class'), '應有 public class');
  });

  it('model 屬性應有 get; set;', async () => {
    const files = await getFiles(BASIC_APIS);
    const model = files['Models/UsersModels.cs'];
    assert.ok(model.includes('{ get; set; }'), '屬性應有 getter/setter');
  });
});

describe('C# Generator — 型別對應', () => {

  it('應正確對應 C# 型別', async () => {
    const files = await getFiles(ALL_TYPES_APIS, 'TypeTest');
    const model = files['Models/ItemsModels.cs'];
    assert.ok(model.includes('string'), 'string → string');
    assert.ok(model.includes('int'), 'int → int');
    assert.ok(model.includes('double'), 'number → double');
    assert.ok(model.includes('bool'), 'boolean → bool');
    assert.ok(model.includes('List<object>'), 'array → List<object>');
  });

  it('model 屬性應有預設值', async () => {
    const files = await getFiles(ALL_TYPES_APIS);
    const model = files['Models/ItemsModels.cs'];
    assert.ok(model.includes('"example"'), 'string 預設值');
    assert.ok(model.includes('= 0'), 'int/number 預設值');
    assert.ok(model.includes('= false'), 'bool 預設值');
  });
});

describe('C# Generator — 多資源', () => {

  it('應為每個資源產生獨立 Controller 和 Model', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    assert.ok(files['Controllers/UsersController.cs'], 'UsersController');
    assert.ok(files['Controllers/ProductsController.cs'], 'ProductsController');
    assert.ok(files['Models/UsersModels.cs'], 'UsersModels');
    assert.ok(files['Models/ProductsModels.cs'], 'ProductsModels');
  });
});

describe('C# Generator — 空 Schema', () => {

  it('空 schema 不應報錯', async () => {
    const result = await generatePreview({ apis: EMPTY_SCHEMA_APIS, projectName: 'Health', language: 'csharp', version: 'net8' });
    assert.ok(result['Program.cs'], 'Program.cs 應存在');
    assert.ok(result['Controllers/HealthController.cs'], 'HealthController 應存在');
  });

  it('空 API 陣列不應報錯', async () => {
    const result = await generatePreview({ apis: [], projectName: 'Empty', language: 'csharp', version: 'net8' });
    assert.ok(result['Program.cs'], 'Program.cs 應存在');
  });
});

describe('C# Generator — PATCH 支援', () => {

  it('應支援 PATCH method', async () => {
    const files = await getFiles(PATCH_APIS);
    const ctrl = files['Controllers/UsersController.cs'];
    assert.ok(ctrl.includes('[HttpPatch'), '應有 HttpPatch attribute');
  });
});
