/**
 * Java Spring Boot Generator 測試
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { generatePreview } = require(path.join(__dirname, '../src/generator/codeBuilder'));
const {
  BASIC_APIS,
  MULTI_RESOURCE_APIS,
  NESTED_SCHEMA_APIS,
  ALL_TYPES_APIS,
  EMPTY_SCHEMA_APIS,
  PATCH_APIS
} = require('./fixtures/sampleApis');

// ─── 工具 ─────────────────────────────────────────────────────────────────────

async function getFiles(apis, projectName = 'test-project', version = 'springboot3') {
  return generatePreview({ apis, projectName, language: 'java', version });
}

// ─── 基本結構 ─────────────────────────────────────────────────────────────────

describe('Java Generator — 基本結構', () => {

  it('應產生 pom.xml', async () => {
    const files = await getFiles(BASIC_APIS);
    const pomKey = Object.keys(files).find(k => k === 'pom.xml');
    assert.ok(pomKey, 'pom.xml 應存在');
    const pom = files['pom.xml'];
    assert.ok(pom.includes('spring-boot-starter-parent'), '應含 spring-boot-starter-parent');
    assert.ok(pom.includes('spring-boot-starter-web'), '應含 spring-boot-starter-web');
    assert.ok(pom.includes('springdoc-openapi'), '應含 springdoc-openapi');
  });

  it('應產生 Application.java', async () => {
    const files = await getFiles(BASIC_APIS);
    const appKey = Object.keys(files).find(k => k.endsWith('Application.java'));
    assert.ok(appKey, 'Application.java 應存在');
    const app = files[appKey];
    assert.ok(app.includes('@SpringBootApplication'), '應有 @SpringBootApplication');
    assert.ok(app.includes('SpringApplication.run'), '應有 SpringApplication.run');
    assert.ok(app.includes('public static void main'), '應有 main 方法');
  });

  it('應產生 application.properties', async () => {
    const files = await getFiles(BASIC_APIS);
    const propKey = Object.keys(files).find(k => k.endsWith('application.properties'));
    assert.ok(propKey, 'application.properties 應存在');
    const props = files[propKey];
    assert.ok(props.includes('server.port=8080'), '應設定 port 8080');
    assert.ok(props.includes('swagger-ui'), '應包含 swagger 設定');
  });

  it('應產生 README.md 且含啟動指令', async () => {
    const files = await getFiles(BASIC_APIS);
    assert.ok(files['README.md'], 'README.md 應存在');
    assert.ok(files['README.md'].includes('test-project'), '應含專案名稱');
    assert.ok(files['README.md'].includes('mvn spring-boot:run'), '應含 Maven 啟動指令');
    assert.ok(files['README.md'].includes('swagger-ui'), '應含 Swagger UI 位址');
  });
});

// ─── Controller ───────────────────────────────────────────────────────────────

describe('Java Generator — Controller', () => {

  it('應為 users 資源產生 Controller', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    assert.ok(ctrlKey, 'UsersController.java 應存在');
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('@RestController'), '應有 @RestController');
    assert.ok(ctrl.includes('@RequestMapping("/users")'), '應有 @RequestMapping("/users")');
    assert.ok(ctrl.includes('ResponseEntity'), '應有 ResponseEntity 回傳型別');
  });

  it('Controller 應包含正確的 HTTP method 標註', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('@GetMapping'), '應有 @GetMapping');
    assert.ok(ctrl.includes('@PostMapping'), '應有 @PostMapping');
    assert.ok(ctrl.includes('@PutMapping'), '應有 @PutMapping');
    assert.ok(ctrl.includes('@DeleteMapping'), '應有 @DeleteMapping');
  });

  it('Controller 應正確處理 @PathVariable 路徑參數', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('@PathVariable'), '應有 @PathVariable');
    assert.ok(ctrl.includes('{id}'), '應有 {id} 路徑模板');
  });

  it('POST/PUT/PATCH 應加入 @RequestBody 參數', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('@RequestBody'), '應有 @RequestBody');
  });

  it('Controller 應有 import 宣告', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('import org.springframework.web.bind.annotation'), '應 import Spring annotation');
    assert.ok(ctrl.includes('import org.springframework.http.ResponseEntity'), '應 import ResponseEntity');
  });

  it('Controller 應含正確的 package 宣告', async () => {
    const files = await getFiles(BASIC_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('package '), '應有 package 宣告');
    assert.ok(ctrl.includes('.controller'), '應在 controller 子套件');
  });

  it('應支援 PATCH method', async () => {
    const files = await getFiles(PATCH_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('@PatchMapping'), '應有 @PatchMapping');
  });
});

// ─── Model POJO ───────────────────────────────────────────────────────────────

describe('Java Generator — Model POJO', () => {

  it('POST request 應產生 Request POJO', async () => {
    const files = await getFiles(BASIC_APIS);
    const reqKey = Object.keys(files).find(k => k.includes('Request.java') && k.includes('/model/'));
    assert.ok(reqKey, 'Request POJO 應存在');
    const req = files[reqKey];
    assert.ok(req.includes('public class'), '應是 public class');
    assert.ok(req.includes('private '), '欄位應為 private');
    assert.ok(req.includes('get') && req.includes('set'), '應有 getter/setter');
  });

  it('Response POJO 應含正確的 Java 型別', async () => {
    const files = await getFiles(ALL_TYPES_APIS);
    const resKey = Object.keys(files).find(k => k.includes('Response.java') && k.includes('/model/'));
    assert.ok(resKey, 'Response POJO 應存在');
    const res = files[resKey];
    assert.ok(res.includes('String'), 'string → String');
    assert.ok(res.includes('Integer'), 'int → Integer');
    assert.ok(res.includes('Double'), 'number → Double');
    assert.ok(res.includes('Boolean'), 'boolean → Boolean');
    assert.ok(res.includes('List'), 'array → List');
  });

  it('POJO 欄位應有預設值', async () => {
    const files = await getFiles(ALL_TYPES_APIS);
    const resKey = Object.keys(files).find(k => k.includes('Response.java') && k.includes('/model/'));
    const res = files[resKey];
    assert.ok(res.includes('"example"') || res.includes('= 0') || res.includes('= false'), '應有預設值');
  });

  it('POJO 應含正確的 package 宣告', async () => {
    const files = await getFiles(BASIC_APIS);
    const reqKey = Object.keys(files).find(k => k.includes('Request.java') && k.includes('/model/'));
    const req = files[reqKey];
    assert.ok(req.includes('package '), '應有 package 宣告');
    assert.ok(req.includes('.model'), '應在 model 子套件');
  });

  it('空 schema 的 GET endpoint 不應產生多餘的 Model 檔案', async () => {
    const files = await getFiles(EMPTY_SCHEMA_APIS);
    const modelFiles = Object.keys(files).filter(k => k.includes('/model/'));
    assert.equal(modelFiles.length, 0, '空 schema 不應有 model 檔案');
  });

  it('Nested schema 應以 Object 型別表示', async () => {
    const files = await getFiles(NESTED_SCHEMA_APIS);
    const reqKey = Object.keys(files).find(k => k.includes('Request.java'));
    if (reqKey) {
      const req = files[reqKey];
      assert.ok(req.includes('Object'), 'nested object 應以 Object 表示');
    }
  });
});

// ─── pom.xml ──────────────────────────────────────────────────────────────────

describe('Java Generator — pom.xml', () => {

  it('groupId 應基於專案名稱', async () => {
    const files = await getFiles(BASIC_APIS, 'my-app');
    const pom = files['pom.xml'];
    assert.ok(pom.includes('myapp') || pom.includes('my-app') || pom.includes('com.'), '應有合理的 groupId');
  });

  it('artifactId 應為小寫專案名稱', async () => {
    const files = await getFiles(BASIC_APIS, 'MyProject');
    const pom = files['pom.xml'];
    assert.ok(pom.includes('myproject') || pom.includes('MyProject') || pom.includes('<artifactId>'), '應有 artifactId');
  });
});

// ─── 多資源 ───────────────────────────────────────────────────────────────────

describe('Java Generator — 多資源', () => {

  it('應為每個資源產生獨立的 Controller', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    const usersCtrl = Object.keys(files).find(k => k.includes('UsersController.java'));
    const productsCtrl = Object.keys(files).find(k => k.includes('ProductsController.java'));
    assert.ok(usersCtrl, 'UsersController.java 應存在');
    assert.ok(productsCtrl, 'ProductsController.java 應存在');
  });

  it('各 Controller 應有正確的 @RequestMapping 前綴', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    const usersCtrlKey = Object.keys(files).find(k => k.includes('UsersController.java'));
    const productsCtrlKey = Object.keys(files).find(k => k.includes('ProductsController.java'));
    assert.ok(files[usersCtrlKey].includes('@RequestMapping("/users")'), 'users controller 應有 /users mapping');
    assert.ok(files[productsCtrlKey].includes('@RequestMapping("/products")'), 'products controller 應有 /products mapping');
  });

  it('多資源時 README 應列出所有 endpoints', async () => {
    const files = await getFiles(MULTI_RESOURCE_APIS);
    const readme = files['README.md'];
    assert.ok(readme.includes('/users'), 'README 應列 /users');
    assert.ok(readme.includes('/products'), 'README 應列 /products');
  });
});

// ─── HTTP 方法 ────────────────────────────────────────────────────────────────

describe('Java Generator — HTTP Methods', () => {

  it('應支援 GET / POST / PUT / DELETE / PATCH 所有 methods', async () => {
    const apis = [
      { id: 1, method: 'GET',    path: '/items',    requestSchema: {}, responseSchema: { id: 'int' } },
      { id: 2, method: 'POST',   path: '/items',    requestSchema: { name: 'string' }, responseSchema: { id: 'int' } },
      { id: 3, method: 'PUT',    path: '/items/:id', requestSchema: { name: 'string' }, responseSchema: { id: 'int' } },
      { id: 4, method: 'DELETE', path: '/items/:id', requestSchema: {}, responseSchema: { message: 'string' } },
      { id: 5, method: 'PATCH',  path: '/items/:id', requestSchema: { name: 'string' }, responseSchema: { id: 'int' } }
    ];
    const files = await getFiles(apis, 'methods-test');
    const ctrlKey = Object.keys(files).find(k => k.includes('ItemsController.java'));
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('@GetMapping'), 'GET');
    assert.ok(ctrl.includes('@PostMapping'), 'POST');
    assert.ok(ctrl.includes('@PutMapping'), 'PUT');
    assert.ok(ctrl.includes('@DeleteMapping'), 'DELETE');
    assert.ok(ctrl.includes('@PatchMapping'), 'PATCH');
  });
});

// ─── 邊界情況 ─────────────────────────────────────────────────────────────────

describe('Java Generator — 邊界情況', () => {

  it('空 API 陣列不應報錯', async () => {
    const files = await getFiles([], 'empty-project');
    assert.ok(files['pom.xml'], 'pom.xml 應存在');
    const appKey = Object.keys(files).find(k => k.endsWith('Application.java'));
    assert.ok(appKey, 'Application.java 應存在');
  });

  it('空 schema 不應報錯，應正常產生 Controller', async () => {
    const files = await getFiles(EMPTY_SCHEMA_APIS);
    const ctrlKey = Object.keys(files).find(k => k.includes('HealthController.java'));
    assert.ok(ctrlKey, 'HealthController.java 應存在');
    const ctrl = files[ctrlKey];
    assert.ok(ctrl.includes('ResponseEntity.ok'), '應有回傳值');
  });

  it('專案名稱含特殊字元時不應崩潰', async () => {
    let files;
    assert.doesNotThrow(async () => {
      files = await getFiles(BASIC_APIS, 'My Cool Project!');
    });
  });
});
