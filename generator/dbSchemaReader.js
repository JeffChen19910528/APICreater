// Database schema reader — runs in Electron main process
// Supports: MySQL, PostgreSQL, SQLite, MS SQL Server, Oracle

// ─── Type Mappers ─────────────────────────────────────────────────────────────

function mapMysqlType(t) {
  t = (t || '').toLowerCase();
  if (['int','integer','bigint','smallint','tinyint','mediumint'].includes(t)) return 'int';
  if (['float','double','decimal','numeric','real'].includes(t)) return 'number';
  if (['bool','boolean'].includes(t)) return 'boolean';
  if (t === 'json') return 'object';
  return 'string';
}

function mapPostgresType(t) {
  t = (t || '').toLowerCase();
  if (['integer','bigint','smallint','int','int2','int4','int8'].includes(t)) return 'int';
  if (['real','double precision','numeric','decimal','float4','float8','money'].includes(t)) return 'number';
  if (['boolean','bool'].includes(t)) return 'boolean';
  if (['json','jsonb'].includes(t)) return 'object';
  if (t === 'array' || t.startsWith('_')) return 'array';
  return 'string';
}

function mapSqliteType(affinity) {
  const t = (affinity || '').toUpperCase();
  if (t.includes('INT')) return 'int';
  if (['REAL','FLOAT','DOUBLE','NUMERIC','DECIMAL'].some(k => t.includes(k))) return 'number';
  if (t.includes('BOOL')) return 'boolean';
  return 'string';
}

function mapMssqlType(t) {
  t = (t || '').toLowerCase();
  if (['int','bigint','smallint','tinyint'].includes(t)) return 'int';
  if (['float','real','decimal','numeric','money','smallmoney'].includes(t)) return 'number';
  if (t === 'bit') return 'boolean';
  return 'string';
}

function mapOracleType(t) {
  t = (t || '').toUpperCase();
  if (['INTEGER','INT','SMALLINT'].includes(t)) return 'int';
  if (['NUMBER','FLOAT','BINARY_FLOAT','BINARY_DOUBLE'].includes(t)) return 'number';
  return 'string';
}

module.exports.mapMysqlType = mapMysqlType;
module.exports.mapPostgresType = mapPostgresType;
module.exports.mapSqliteType = mapSqliteType;
module.exports.mapMssqlType = mapMssqlType;
module.exports.mapOracleType = mapOracleType;

// ─── Schema Readers ───────────────────────────────────────────────────────────

async function getMysqlSchema({ host, port, database, username, password }) {
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({
    host, port: port || 3306, user: username, password, database,
    connectTimeout: 10000
  });
  try {
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [database]
    );
    const schema = {};
    for (const { TABLE_NAME } of tables) {
      const [cols] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [database, TABLE_NAME]
      );
      schema[TABLE_NAME] = cols.map(c => ({
        name: c.COLUMN_NAME,
        type: mapMysqlType(c.DATA_TYPE),
        nullable: c.IS_NULLABLE === 'YES',
        primaryKey: c.COLUMN_KEY === 'PRI'
      }));
    }
    return schema;
  } finally {
    await conn.end();
  }
}

async function getPostgresSchema({ host, port, database, username, password }) {
  const { Client } = require('pg');
  const client = new Client({
    host, port: port || 5432, database, user: username, password,
    connectionTimeoutMillis: 10000
  });
  await client.connect();
  try {
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const schema = {};
    for (const { table_name } of tablesRes.rows) {
      const colsRes = await client.query(`
        SELECT c.column_name, c.data_type, c.is_nullable,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_pk
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name AND tc.table_name = ku.table_name
          WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1 AND tc.table_schema = 'public'
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
      `, [table_name]);
      schema[table_name] = colsRes.rows.map(c => ({
        name: c.column_name,
        type: mapPostgresType(c.data_type),
        nullable: c.is_nullable === 'YES',
        primaryKey: c.is_pk
      }));
    }
    return schema;
  } finally {
    await client.end();
  }
}

function getSqliteSchema({ filePath }) {
  const Database = require('better-sqlite3');
  const db = new Database(filePath, { readonly: true });
  try {
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    ).all();
    const schema = {};
    for (const { name } of tables) {
      const cols = db.prepare(`PRAGMA table_info("${name}")`).all();
      schema[name] = cols.map(c => ({
        name: c.name,
        type: mapSqliteType(c.type),
        nullable: !c.notnull,
        primaryKey: c.pk === 1
      }));
    }
    return schema;
  } finally {
    db.close();
  }
}

async function getMssqlSchema({ host, port, database, username, password }) {
  const sql = require('mssql');
  const pool = await sql.connect({
    server: host,
    port: port || 1433,
    user: username,
    password,
    database,
    options: { encrypt: false, trustServerCertificate: true },
    connectionTimeout: 10000
  });
  try {
    const tablesRes = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = '${database.replace(/'/g, "''")}'
    `);
    const schema = {};
    for (const { TABLE_NAME } of tablesRes.recordset) {
      const safe = TABLE_NAME.replace(/'/g, "''");
      const colsRes = await pool.request().query(`
        SELECT c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PK
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.TABLE_NAME = '${safe}'
        ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_NAME = '${safe}'
        ORDER BY c.ORDINAL_POSITION
      `);
      schema[TABLE_NAME] = colsRes.recordset.map(c => ({
        name: c.COLUMN_NAME,
        type: mapMssqlType(c.DATA_TYPE),
        nullable: c.IS_NULLABLE === 'YES',
        primaryKey: c.IS_PK === 1
      }));
    }
    return schema;
  } finally {
    await pool.close();
  }
}

async function getOracleSchema({ host, port, serviceName, username, password }) {
  const oracledb = require('oracledb');
  const connectString = `${host}:${port || 1521}/${serviceName || 'XEPDB1'}`;
  const conn = await oracledb.getConnection({ user: username, password, connectString });
  try {
    const owner = username.toUpperCase();
    const tablesRes = await conn.execute(
      `SELECT table_name FROM all_tables WHERE owner = :owner ORDER BY table_name`,
      [owner]
    );
    const schema = {};
    for (const [tableName] of tablesRes.rows) {
      const colsRes = await conn.execute(`
        SELECT ac.column_name, ac.data_type, ac.nullable,
          CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END AS is_pk
        FROM all_tab_columns ac
        LEFT JOIN (
          SELECT acc.column_name
          FROM all_constraints c
          JOIN all_cons_columns acc ON c.constraint_name = acc.constraint_name AND c.owner = acc.owner
          WHERE c.constraint_type = 'P' AND c.table_name = :tname AND c.owner = :owner
        ) pk ON ac.column_name = pk.column_name
        WHERE ac.table_name = :tname AND ac.owner = :owner
        ORDER BY ac.column_id
      `, { tname: tableName, owner });
      schema[tableName] = colsRes.rows.map(([colName, dataType, nullable, isPk]) => ({
        name: colName.toLowerCase(),
        type: mapOracleType(dataType),
        nullable: nullable === 'Y',
        primaryKey: isPk === 1
      }));
    }
    return schema;
  } finally {
    await conn.close();
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

async function connectAndGetSchema(dbConfig) {
  switch (dbConfig.type) {
    case 'mysql':      return getMysqlSchema(dbConfig);
    case 'postgresql': return getPostgresSchema(dbConfig);
    case 'sqlite':     return getSqliteSchema(dbConfig);
    case 'mssql':      return getMssqlSchema(dbConfig);
    case 'oracle':     return getOracleSchema(dbConfig);
    default: throw new Error(`Unsupported database type: ${dbConfig.type}`);
  }
}

module.exports.connectAndGetSchema = connectAndGetSchema;
