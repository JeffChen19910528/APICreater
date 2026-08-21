/**
 * 資料庫功能測試
 * 測試 DB schema 型別對應、程式碼產生器的 DB 模式
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  mapMysqlType,
  mapPostgresType,
  mapSqliteType,
  mapMssqlType,
  mapOracleType
} = require(path.join(__dirname, '../src/generator/dbSchemaReader'));

const {
  generateDbIndex,
  generateEnvFile,
  generateDbController
} = require(path.join(__dirname, '../src/generator/codeBuilder'));

const { generatePreview } = require(path.join(__dirname, '../src/generator/codeBuilder'));

// ─── DB-imported API fixture ──────────────────────────────────────────────────

const DB_USERS_APIS = [
  {
    id: 100, method: 'GET', path: '/users',
    description: '列出所有使用者',
    requestSchema: {}, responseSchema: { id: 'int', name: 'string', email: 'string' },
    tableName: 'users',
    tableColumns: [
      { name: 'id',    type: 'int',    nullable: false, primaryKey: true  },
      { name: 'name',  type: 'string', nullable: true,  primaryKey: false },
      { name: 'email', type: 'string', nullable: true,  primaryKey: false }
    ]
  },
  {
    id: 101, method: 'GET', path: '/users/:id',
    description: '取得單一使用者',
    requestSchema: {}, responseSchema: { id: 'int', name: 'string', email: 'string' },
    tableName: 'users',
    tableColumns: [
      { name: 'id',    type: 'int',    nullable: false, primaryKey: true  },
      { name: 'name',  type: 'string', nullable: true,  primaryKey: false },
      { name: 'email', type: 'string', nullable: true,  primaryKey: false }
    ]
  },
  {
    id: 102, method: 'POST', path: '/users',
    description: '建立使用者',
    requestSchema: { name: 'string', email: 'string' },
    responseSchema: { id: 'int', name: 'string', email: 'string' },
    tableName: 'users',
    tableColumns: [
      { name: 'id',    type: 'int',    nullable: false, primaryKey: true  },
      { name: 'name',  type: 'string', nullable: true,  primaryKey: false },
      { name: 'email', type: 'string', nullable: true,  primaryKey: false }
    ]
  },
  {
    id: 103, method: 'PUT', path: '/users/:id',
    description: '更新使用者',
    requestSchema: { name: 'string', email: 'string' },
    responseSchema: { id: 'int', name: 'string', email: 'string' },
    tableName: 'users',
    tableColumns: [
      { name: 'id',    type: 'int',    nullable: false, primaryKey: true  },
      { name: 'name',  type: 'string', nullable: true,  primaryKey: false },
      { name: 'email', type: 'string', nullable: true,  primaryKey: false }
    ]
  },
  {
    id: 104, method: 'DELETE', path: '/users/:id',
    description: '刪除使用者',
    requestSchema: {},
    responseSchema: { message: 'string' },
    tableName: 'users',
    tableColumns: [
      { name: 'id',    type: 'int',    nullable: false, primaryKey: true  }
    ]
  }
];

// ─── 型別對應測試 ─────────────────────────────────────────────────────────────

describe('MySQL 型別對應', () => {
  it('整數型別應對應為 int', () => {
    assert.equal(mapMysqlType('int'),       'int');
    assert.equal(mapMysqlType('integer'),   'int');
    assert.equal(mapMysqlType('bigint'),    'int');
    assert.equal(mapMysqlType('smallint'),  'int');
    assert.equal(mapMysqlType('tinyint'),   'int');
    assert.equal(mapMysqlType('mediumint'), 'int');
  });
  it('浮點/小數型別應對應為 number', () => {
    assert.equal(mapMysqlType('float'),   'number');
    assert.equal(mapMysqlType('double'),  'number');
    assert.equal(mapMysqlType('decimal'), 'number');
    assert.equal(mapMysqlType('numeric'), 'number');
    assert.equal(mapMysqlType('real'),    'number');
  });
  it('布林型別應對應為 boolean', () => {
    assert.equal(mapMysqlType('bool'),    'boolean');
    assert.equal(mapMysqlType('boolean'), 'boolean');
  });
  it('JSON 型別應對應為 object', () => {
    assert.equal(mapMysqlType('json'), 'object');
  });
  it('字串型別應對應為 string', () => {
    assert.equal(mapMysqlType('varchar'),  'string');
    assert.equal(mapMysqlType('text'),     'string');
    assert.equal(mapMysqlType('char'),     'string');
    assert.equal(mapMysqlType('datetime'), 'string');
    assert.equal(mapMysqlType('date'),     'string');
  });
  it('未知型別應回傳 string', () => {
    assert.equal(mapMysqlType('unknown'), 'string');
    assert.equal(mapMysqlType(''),        'string');
    assert.equal(mapMysqlType(null),      'string');
  });
});

describe('PostgreSQL 型別對應', () => {
  it('整數型別應對應為 int', () => {
    assert.equal(mapPostgresType('integer'), 'int');
    assert.equal(mapPostgresType('bigint'),  'int');
    assert.equal(mapPostgresType('int'),     'int');
    assert.equal(mapPostgresType('int4'),    'int');
    assert.equal(mapPostgresType('int8'),    'int');
  });
  it('浮點型別應對應為 number', () => {
    assert.equal(mapPostgresType('real'),             'number');
    assert.equal(mapPostgresType('double precision'), 'number');
    assert.equal(mapPostgresType('numeric'),          'number');
    assert.equal(mapPostgresType('decimal'),          'number');
    assert.equal(mapPostgresType('money'),            'number');
  });
  it('布林型別應對應為 boolean', () => {
    assert.equal(mapPostgresType('boolean'), 'boolean');
    assert.equal(mapPostgresType('bool'),    'boolean');
  });
  it('JSON 型別應對應為 object', () => {
    assert.equal(mapPostgresType('json'),  'object');
    assert.equal(mapPostgresType('jsonb'), 'object');
  });
  it('字串型別應對應為 string', () => {
    assert.equal(mapPostgresType('text'),              'string');
    assert.equal(mapPostgresType('character varying'), 'string');
    assert.equal(mapPostgresType('timestamp'),         'string');
  });
});

describe('SQLite 型別對應', () => {
  it('整數型別應對應為 int', () => {
    assert.equal(mapSqliteType('INTEGER'),  'int');
    assert.equal(mapSqliteType('INT'),      'int');
    assert.equal(mapSqliteType('BIGINT'),   'int');
    assert.equal(mapSqliteType('SMALLINT'), 'int');
  });
  it('浮點型別應對應為 number', () => {
    assert.equal(mapSqliteType('REAL'),    'number');
    assert.equal(mapSqliteType('FLOAT'),   'number');
    assert.equal(mapSqliteType('DOUBLE'),  'number');
    assert.equal(mapSqliteType('NUMERIC'), 'number');
    assert.equal(mapSqliteType('DECIMAL'), 'number');
  });
  it('布林型別應對應為 boolean', () => {
    assert.equal(mapSqliteType('BOOLEAN'), 'boolean');
    assert.equal(mapSqliteType('BOOL'),    'boolean');
  });
  it('空值或未知應對應為 string', () => {
    assert.equal(mapSqliteType('TEXT'),    'string');
    assert.equal(mapSqliteType('VARCHAR'), 'string');
    assert.equal(mapSqliteType(''),        'string');
    assert.equal(mapSqliteType(null),      'string');
  });
});

describe('MS SQL Server 型別對應', () => {
  it('整數型別應對應為 int', () => {
    assert.equal(mapMssqlType('int'),      'int');
    assert.equal(mapMssqlType('bigint'),   'int');
    assert.equal(mapMssqlType('smallint'), 'int');
    assert.equal(mapMssqlType('tinyint'),  'int');
  });
  it('浮點型別應對應為 number', () => {
    assert.equal(mapMssqlType('float'),       'number');
    assert.equal(mapMssqlType('real'),        'number');
    assert.equal(mapMssqlType('decimal'),     'number');
    assert.equal(mapMssqlType('numeric'),     'number');
    assert.equal(mapMssqlType('money'),       'number');
    assert.equal(mapMssqlType('smallmoney'),  'number');
  });
  it('bit 應對應為 boolean', () => {
    assert.equal(mapMssqlType('bit'), 'boolean');
  });
  it('字串型別應對應為 string', () => {
    assert.equal(mapMssqlType('nvarchar'), 'string');
    assert.equal(mapMssqlType('varchar'),  'string');
    assert.equal(mapMssqlType('text'),     'string');
    assert.equal(mapMssqlType('datetime'), 'string');
  });
});

describe('Oracle 型別對應', () => {
  it('整數型別應對應為 int', () => {
    assert.equal(mapOracleType('INTEGER'),  'int');
    assert.equal(mapOracleType('INT'),      'int');
    assert.equal(mapOracleType('SMALLINT'), 'int');
  });
  it('數值型別應對應為 number', () => {
    assert.equal(mapOracleType('NUMBER'),        'number');
    assert.equal(mapOracleType('FLOAT'),         'number');
    assert.equal(mapOracleType('BINARY_FLOAT'),  'number');
    assert.equal(mapOracleType('BINARY_DOUBLE'), 'number');
  });
  it('字串型別應對應為 string', () => {
    assert.equal(mapOracleType('VARCHAR2'),  'string');
    assert.equal(mapOracleType('NVARCHAR2'), 'string');
    assert.equal(mapOracleType('CHAR'),      'string');
    assert.equal(mapOracleType('DATE'),      'string');
    assert.equal(mapOracleType('CLOB'),      'string');
  });
});

// ─── DB 程式碼產生測試 ────────────────────────────────────────────────────────

describe('generateDbIndex — Node.js DB 連線設定', () => {
  it('MySQL: 應包含 mysql2/promise 與 createPool', () => {
    const code = generateDbIndex({ type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' });
    assert.ok(code.includes("require('mysql2/promise')"), '應引入 mysql2/promise');
    assert.ok(code.includes('createPool'),                '應建立連線池');
    assert.ok(code.includes('localhost'),                 '應包含主機');
    assert.ok(code.includes('mydb'),                      '應包含資料庫名稱');
  });

  it('PostgreSQL: 應包含 pg 與 Pool', () => {
    const code = generateDbIndex({ type: 'postgresql', host: 'db.host', port: 5432, database: 'testdb', username: 'postgres', password: 'pass' });
    assert.ok(code.includes("require('pg')"),  '應引入 pg');
    assert.ok(code.includes('Pool'),           '應建立 Pool');
    assert.ok(code.includes('db.host'),        '應包含主機');
    assert.ok(code.includes('testdb'),         '應包含資料庫名稱');
  });

  it('SQLite: 應包含 better-sqlite3', () => {
    const code = generateDbIndex({ type: 'sqlite', filePath: './app.db' });
    assert.ok(code.includes("require('better-sqlite3')"), '應引入 better-sqlite3');
    assert.ok(code.includes('app.db'),                    '應包含檔案路徑');
    assert.ok(code.includes('journal_mode = WAL'),        '應設定 WAL 模式');
  });

  it('MSSQL: 應包含 mssql 與 poolPromise', () => {
    const code = generateDbIndex({ type: 'mssql', host: 'sqlserver', port: 1433, database: 'salesdb', username: 'sa', password: '' });
    assert.ok(code.includes("require('mssql')"),   '應引入 mssql');
    assert.ok(code.includes('poolPromise'),         '應建立 poolPromise');
    assert.ok(code.includes('sqlserver'),           '應包含主機');
    assert.ok(code.includes('salesdb'),             '應包含資料庫名稱');
  });

  it('Oracle: 應包含 oracledb 與 getConnection', () => {
    const code = generateDbIndex({ type: 'oracle', host: 'ora.host', port: 1521, serviceName: 'ORCL', username: 'hr', password: '' });
    assert.ok(code.includes("require('oracledb')"), '應引入 oracledb');
    assert.ok(code.includes('getConnection'),        '應包含 getConnection');
    assert.ok(code.includes('ora.host'),             '應包含主機');
    assert.ok(code.includes('ORCL'),                 '應包含服務名稱');
  });
});

describe('generateEnvFile — .env 檔案', () => {
  it('MySQL: 應包含所有連線參數', () => {
    const env = generateEnvFile({ type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: 'secret' });
    assert.ok(env.includes('DB_HOST=localhost'),  '應包含 DB_HOST');
    assert.ok(env.includes('DB_PORT=3306'),       '應包含 DB_PORT');
    assert.ok(env.includes('DB_NAME=mydb'),       '應包含 DB_NAME');
    assert.ok(env.includes('DB_USER=root'),       '應包含 DB_USER');
    assert.ok(env.includes('PORT=3000'),          '應包含 PORT');
  });

  it('SQLite: 應包含 DB_PATH', () => {
    const env = generateEnvFile({ type: 'sqlite', filePath: './data.db' });
    assert.ok(env.includes('DB_PATH=./data.db'), '應包含 DB_PATH');
    assert.ok(!env.includes('DB_HOST'),          '不應包含 DB_HOST');
  });

  it('Oracle: 應包含 DB_CONNECT_STRING', () => {
    const env = generateEnvFile({ type: 'oracle', host: 'ora.host', port: 1521, serviceName: 'ORCL', username: 'hr', password: 'pass' });
    assert.ok(env.includes('DB_CONNECT_STRING'), '應包含 DB_CONNECT_STRING');
    assert.ok(env.includes('ora.host'),          '應包含主機');
    assert.ok(env.includes('ORCL'),              '應包含服務名稱');
  });
});

describe('generateDbController — MySQL', () => {
  const mysqlConfig = { type: 'mysql' };
  const endpoints = DB_USERS_APIS.map(ep => ({
    ...ep,
    subPath: ep.path.replace(/^\/users/, '') || '/',
    fullPath: ep.path,
    handlerName: ep.method.toLowerCase() + (ep.path.includes(':id') ? 'ById' : '')
  }));

  it('應引入 db 模組', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes("require('../db')"), '應引入 db 模組');
  });

  it('GET 全部: 應包含 SELECT * FROM `users`', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes('SELECT * FROM `users`'), '應包含 SELECT 查詢');
  });

  it('GET 單筆: 應包含 WHERE pkCol = ? 與 404 處理', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes('WHERE id = ?'),   '應包含 WHERE 條件');
    assert.ok(ctrl.includes('404'),            '應包含 404 回應');
  });

  it('POST: 應包含 INSERT 語句', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes('INSERT INTO `users`'), '應包含 INSERT 語句');
    assert.ok(ctrl.includes('insertId'),            '應包含 insertId');
  });

  it('PUT: 應包含 UPDATE 語句', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes('UPDATE `users`'), '應包含 UPDATE 語句');
    assert.ok(ctrl.includes('SET'),            '應包含 SET 子句');
  });

  it('DELETE: 應包含 DELETE 語句', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes('DELETE FROM `users`'), '應包含 DELETE 語句');
  });

  it('應包含 try/catch 錯誤處理', () => {
    const ctrl = generateDbController('users', endpoints, mysqlConfig);
    assert.ok(ctrl.includes('try {'),  '應包含 try 區塊');
    assert.ok(ctrl.includes('catch (err)'), '應包含 catch 區塊');
    assert.ok(ctrl.includes('status(500)'), '應包含 500 錯誤回應');
  });
});

describe('generateDbController — PostgreSQL', () => {
  const pgConfig = { type: 'postgresql' };
  const endpoints = DB_USERS_APIS.map(ep => ({
    ...ep,
    subPath: ep.path.replace(/^\/users/, '') || '/',
    fullPath: ep.path,
    handlerName: ep.method.toLowerCase() + (ep.path.includes(':id') ? 'ById' : '')
  }));

  it('GET 全部: 應使用雙引號包住資料表名稱', () => {
    const ctrl = generateDbController('users', endpoints, pgConfig);
    assert.ok(ctrl.includes('SELECT * FROM "users"'), '應使用雙引號');
  });

  it('GET 單筆: 應使用 $1 佔位符', () => {
    const ctrl = generateDbController('users', endpoints, pgConfig);
    assert.ok(ctrl.includes('$1'), '應使用 $1 佔位符');
  });

  it('POST: 應包含 RETURNING * 子句', () => {
    const ctrl = generateDbController('users', endpoints, pgConfig);
    assert.ok(ctrl.includes('RETURNING *'), '應包含 RETURNING *');
  });
});

describe('generateDbController — SQLite', () => {
  const sqliteConfig = { type: 'sqlite' };
  const endpoints = DB_USERS_APIS.map(ep => ({
    ...ep,
    subPath: ep.path.replace(/^\/users/, '') || '/',
    fullPath: ep.path,
    handlerName: ep.method.toLowerCase() + (ep.path.includes(':id') ? 'ById' : '')
  }));

  it('應使用 db.prepare(...).all() 查詢全部', () => {
    const ctrl = generateDbController('users', endpoints, sqliteConfig);
    assert.ok(ctrl.includes('.all()'), '應使用 .all()');
  });

  it('GET 單筆: 應使用 .get()', () => {
    const ctrl = generateDbController('users', endpoints, sqliteConfig);
    assert.ok(ctrl.includes('.get('), '應使用 .get()');
  });

  it('POST: 應使用 .run() 並回傳 lastInsertRowid', () => {
    const ctrl = generateDbController('users', endpoints, sqliteConfig);
    assert.ok(ctrl.includes('.run('),          '應使用 .run()');
    assert.ok(ctrl.includes('lastInsertRowid'), '應包含 lastInsertRowid');
  });

  it('SQLite 控制器不使用 async/await', () => {
    const ctrl = generateDbController('users', endpoints, sqliteConfig);
    assert.ok(!ctrl.includes('async (req'), 'SQLite 控制器不應為 async');
  });
});

describe('generateDbController — MS SQL Server', () => {
  const mssqlConfig = { type: 'mssql' };
  const endpoints = DB_USERS_APIS.map(ep => ({
    ...ep,
    subPath: ep.path.replace(/^\/users/, '') || '/',
    fullPath: ep.path,
    handlerName: ep.method.toLowerCase() + (ep.path.includes(':id') ? 'ById' : '')
  }));

  it('應引入 poolPromise 與 sql', () => {
    const ctrl = generateDbController('users', endpoints, mssqlConfig);
    assert.ok(ctrl.includes('poolPromise'), '應引入 poolPromise');
    assert.ok(ctrl.includes('sql,'),        '應引入 sql');
  });

  it('GET 全部: 應使用 [表名] 格式', () => {
    const ctrl = generateDbController('users', endpoints, mssqlConfig);
    assert.ok(ctrl.includes('[users]'), '應使用方括號');
    assert.ok(ctrl.includes('recordset'), '應使用 recordset');
  });

  it('GET 單筆: 應使用 .input() 傳入參數', () => {
    const ctrl = generateDbController('users', endpoints, mssqlConfig);
    assert.ok(ctrl.includes('.input('), '應使用 .input()');
    assert.ok(ctrl.includes('@id'),     '應使用 @id 參數');
  });

  it('POST: 應使用 OUTPUT INSERTED.*', () => {
    const ctrl = generateDbController('users', endpoints, mssqlConfig);
    assert.ok(ctrl.includes('OUTPUT INSERTED.*'), '應包含 OUTPUT INSERTED.*');
  });
});

describe('generateDbController — Oracle', () => {
  const oracleConfig = { type: 'oracle' };
  const endpoints = DB_USERS_APIS.map(ep => ({
    ...ep,
    subPath: ep.path.replace(/^\/users/, '') || '/',
    fullPath: ep.path,
    handlerName: ep.method.toLowerCase() + (ep.path.includes(':id') ? 'ById' : '')
  }));

  it('應引入 getConnection 與 oracledb', () => {
    const ctrl = generateDbController('users', endpoints, oracleConfig);
    assert.ok(ctrl.includes('getConnection'),  '應引入 getConnection');
    assert.ok(ctrl.includes('oracledb'),       '應引入 oracledb');
  });

  it('應使用大寫資料表名稱', () => {
    const ctrl = generateDbController('users', endpoints, oracleConfig);
    assert.ok(ctrl.includes('FROM USERS'), 'Oracle 資料表名稱應為大寫');
  });

  it('Oracle: 應使用 :1 佔位符', () => {
    const ctrl = generateDbController('users', endpoints, oracleConfig);
    assert.ok(ctrl.includes(':1'), '應使用 :1 佔位符');
  });

  it('Oracle: 應包含 finally 關閉連線', () => {
    const ctrl = generateDbController('users', endpoints, oracleConfig);
    assert.ok(ctrl.includes('finally'),      '應有 finally 區塊');
    assert.ok(ctrl.includes('conn.close()'), '應關閉連線');
  });

  it('Oracle: POST 應使用 autoCommit: true', () => {
    const ctrl = generateDbController('users', endpoints, oracleConfig);
    assert.ok(ctrl.includes('autoCommit: true'), '應設定 autoCommit');
  });
});

// ─── 完整 Node.js DB 專案產生測試 ────────────────────────────────────────────

describe('Node.js generatePreview — MySQL 模式', () => {
  it('應產生 db/index.js', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'test-db-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['db/index.js'], 'db/index.js 應存在');
    assert.ok(files['db/index.js'].includes('mysql2/promise'), 'db/index.js 應引入 mysql2');
  });

  it('應產生 .env 檔案', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'test-db-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['.env'], '.env 應存在');
    assert.ok(files['.env'].includes('DB_HOST'), '.env 應包含 DB_HOST');
  });

  it('應產生 .gitignore', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'test-db-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['.gitignore'], '.gitignore 應存在');
    assert.ok(files['.gitignore'].includes('.env'), '.gitignore 應包含 .env');
  });

  it('app.js 應載入 dotenv', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'test-db-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['app.js'].includes("require('dotenv').config()"), 'app.js 應有 dotenv');
  });

  it('package.json 應包含 mysql2 依賴', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'test-db-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies.mysql2, '應包含 mysql2 依賴');
    assert.ok(pkg.dependencies.dotenv, '應包含 dotenv 依賴');
  });

  it('controller 應包含真實 SQL 查詢', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'test-db-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    const ctrl = files['controllers/usersController.js'];
    assert.ok(ctrl, 'usersController.js 應存在');
    assert.ok(ctrl.includes('SELECT * FROM'), '應包含 SELECT 查詢');
    assert.ok(ctrl.includes('INSERT INTO'),   '應包含 INSERT 查詢');
    assert.ok(ctrl.includes('UPDATE'),        '應包含 UPDATE 查詢');
    assert.ok(ctrl.includes('DELETE'),        '應包含 DELETE 查詢');
  });
});

describe('Node.js generatePreview — PostgreSQL 模式', () => {
  it('package.json 應包含 pg 依賴', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'pg-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'postgresql', host: 'localhost', port: 5432, database: 'pgdb', username: 'postgres', password: '' }
    });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies.pg, '應包含 pg 依賴');
  });

  it('controller 應使用 $1 佔位符', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'pg-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'postgresql', host: 'localhost', port: 5432, database: 'pgdb', username: 'postgres', password: '' }
    });
    const ctrl = files['controllers/usersController.js'];
    assert.ok(ctrl.includes('$1'), '應使用 $1 佔位符');
    assert.ok(ctrl.includes('RETURNING *'), '應使用 RETURNING *');
  });
});

describe('Node.js generatePreview — SQLite 模式', () => {
  it('package.json 應包含 better-sqlite3 依賴', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'sqlite-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'sqlite', filePath: './app.db' }
    });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies['better-sqlite3'], '應包含 better-sqlite3 依賴');
  });
});

describe('Node.js generatePreview — MSSQL 模式', () => {
  it('package.json 應包含 mssql 依賴', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'mssql-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'mssql', host: 'localhost', port: 1433, database: 'testdb', username: 'sa', password: '' }
    });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies.mssql, '應包含 mssql 依賴');
  });
});

describe('Node.js generatePreview — Oracle 模式', () => {
  it('package.json 應包含 oracledb 依賴', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'oracle-project',
      language: 'nodejs',
      version: 'express4',
      dbConfig: { type: 'oracle', host: 'localhost', port: 1521, serviceName: 'ORCL', username: 'hr', password: '' }
    });
    const pkg = JSON.parse(files['package.json']);
    assert.ok(pkg.dependencies.oracledb, '應包含 oracledb 依賴');
  });
});

describe('無 dbConfig 時保持原有行為', () => {
  it('不應產生 db/index.js', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'normal-project',
      language: 'nodejs',
      version: 'express4'
    });
    assert.ok(!files['db/index.js'], '不應存在 db/index.js');
    assert.ok(!files['.env'],        '不應存在 .env');
  });

  it('app.js 不應有 dotenv', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'normal-project',
      language: 'nodejs',
      version: 'express4'
    });
    assert.ok(!files['app.js'].includes('dotenv'), 'app.js 不應載入 dotenv');
  });
});

describe('Python generatePreview — MySQL DB 模式', () => {
  it('應產生 database.py', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'py-db-project',
      language: 'python',
      version: 'pydantic2',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['database.py'], 'database.py 應存在');
    assert.ok(files['database.py'].includes('databases'), '應使用 databases 套件');
  });

  it('requirements.txt 應包含 databases[mysql]', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'py-db-project',
      language: 'python',
      version: 'pydantic2',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['requirements.txt'].includes('databases[mysql]'), '應包含 databases[mysql]');
  });

  it('main.py 應有 startup/shutdown 事件', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'py-db-project',
      language: 'python',
      version: 'pydantic2',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    assert.ok(files['main.py'].includes('startup'),  'main.py 應有 startup 事件');
    assert.ok(files['main.py'].includes('shutdown'), 'main.py 應有 shutdown 事件');
  });

  it('router 應使用 database.fetch_all()', async () => {
    const files = await generatePreview({
      apis: DB_USERS_APIS,
      projectName: 'py-db-project',
      language: 'python',
      version: 'pydantic2',
      dbConfig: { type: 'mysql', host: 'localhost', port: 3306, database: 'mydb', username: 'root', password: '' }
    });
    const router = files['routers/users.py'];
    assert.ok(router, 'users router 應存在');
    assert.ok(router.includes('fetch_all'), '應使用 fetch_all');
  });
});
