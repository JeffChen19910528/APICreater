# API Generator

> **語言切換 / Language Switch:** [🇹🇼 中文](#中文說明) | [🇬🇧 English](#english-documentation)

---

<a name="中文說明"></a>

# API Generator — 中文說明

**No-Code RESTful API Generator** — 不需寫程式碼，透過 GUI 設計 REST API，即時預覽，一鍵產生可部署專案。

支援四種語言 × 多個版本：**Node.js (Express 4/5)**、**Python (FastAPI + Pydantic v1/v2)**、**C# (ASP.NET Core 3.1/5/6/8)**、**Java (Spring Boot 2.7/3.2)**

---

## 功能一覽

| 功能 | 說明 |
|------|------|
| API 設計器 | 視覺化新增／編輯 REST API（Method、Path、Description） |
| Schema Builder | 設定 Request / Response JSON 結構，支援 nested object、型別選單 |
| **🗄 資料庫匯入** | 連接資料庫，讀取資料表結構，自動產生完整 CRUD API |
| 版本選擇 | 依語言選擇 Framework 版本，相容舊伺服器部署環境 |
| 程式碼預覽 | 即時瀏覽產生的所有檔案，含語法高亮 |
| 匯出專案 | 選擇資料夾，一鍵輸出完整可執行專案 |

---

## 🗄 資料庫匯入功能

### 支援資料庫

| 資料庫 | 驅動程式 | 預設 Port |
|--------|---------|---------|
| MySQL | `mysql2` (純 JS) | 3306 |
| PostgreSQL | `pg` (純 JS) | 5432 |
| SQLite | `better-sqlite3` | — |
| MS SQL Server | `mssql` (純 JS) | 1433 |
| Oracle | `oracledb` | 1521 |

### 使用方式

1. 點擊側欄「**資料庫匯入**」頁面
2. 選擇資料庫類型，填入連線資訊
3. 點擊「**連線並讀取資料表**」
4. 勾選要產生 API 的資料表
5. 點擊「**匯入至 API 設計器**」

系統會為每張資料表自動產生 5 個 CRUD API：

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/tablename` | 列出所有資料 |
| GET | `/tablename/:id` | 取得單筆 |
| POST | `/tablename` | 新增 |
| PUT | `/tablename/:id` | 更新 |
| DELETE | `/tablename/:id` | 刪除 |

### 產生的程式碼特色

產生專案時，如有連接資料庫，會自動產生：

- **`db/index.js`** — 資料庫連線池設定（Node.js）
- **`.env`** — 環境變數（含資料庫連線資訊）
- **`.gitignore`** — 自動排除 `.env`
- **Controllers** — 包含真實 SQL 查詢（非 TODO 佔位符）

各語言對應的查詢方式：

| 語言 | DB 函式庫 |
|------|---------|
| Node.js + MySQL | `mysql2/promise` + connection pool |
| Node.js + PostgreSQL | `pg` + Pool |
| Node.js + SQLite | `better-sqlite3` (同步) |
| Node.js + MSSQL | `mssql` + poolPromise |
| Node.js + Oracle | `oracledb` + getConnection |
| Python + MySQL/PG/SQLite | `databases` (async) |
| Python + MSSQL | `pyodbc` (同步) |
| Python + Oracle | `cx_Oracle` (同步) |
| C# | Dapper + 對應 ADO.NET provider |
| Java | Spring Data JDBC + JdbcTemplate |

### SQLite / Oracle 安裝注意事項

SQLite 與 Oracle 的 Node.js 驅動程式需要原生編譯：

```bash
# SQLite
npm install better-sqlite3
npx electron-rebuild

# Oracle（需另外安裝 Oracle Instant Client）
npm install oracledb
npx electron-rebuild
```

---

## 版本選擇

### Node.js (Express)

| 版本 | 徽章 | 最低需求 | 說明 |
|------|------|---------|------|
| `express4`（預設） | Latest | Node.js 14+ | Express 4.x — 廣泛使用，最穩定 |
| `express5` | Stable | Node.js 18+ | Express 5.x — async 錯誤自動轉送 |

### Python (FastAPI)

| 版本 | 徽章 | 最低需求 | 說明 |
|------|------|---------|------|
| `pydantic2`（預設） | Latest | Python 3.10+ | Pydantic v2 — 最新型別系統 |
| `pydantic1` | LTS | Python 3.8+ | Pydantic v1 — 相容性較廣 |
| `legacy` | Legacy | Python 3.7+ | FastAPI 0.68+ / Pydantic v1 |

### C# (ASP.NET Core)

| 版本 | 徽章 | 最低需求 |
|------|------|---------|
| `net8`（預設） | LTS | .NET 8.0 SDK |
| `net6` | LTS | .NET 6.0 SDK |
| `net5` | EOL | .NET 5.0 SDK |
| `net31` | EOL | .NET Core 3.1 SDK |

### Java (Spring Boot)

| 版本 | 徽章 | 最低需求 |
|------|------|---------|
| `springboot3`（預設） | Latest | Java 17+、Maven 3.6+ |
| `springboot2` | Stable | Java 11+、Maven 3.6+ |

---

## 快速啟動

```bash
# 安裝依賴
npm install --legacy-peer-deps

# 啟動應用程式
npm run launch
# 或
node launcher.js
```

---

## 執行測試

```bash
# 全部測試（含資料庫功能測試）
node tests/run-tests.js

# 個別測試
npm run test:node      # Node.js 產生器
npm run test:python    # Python 產生器
npm run test:csharp    # C# 產生器
npm run test:database  # 資料庫匯入功能（70 項測試）
```

**測試涵蓋範圍（共 155+ 項）：**
- Node.js 產生器：15 項
- Python 產生器：21 項
- C# 產生器：23 項
- Java 產生器：26 項
- Integration 磁碟：13 項
- 版本差異：34 項
- 資料庫功能：70 項（型別對應、SQL 產生、5 種資料庫）

---

## 技術架構

| 層次 | 技術 |
|------|------|
| 桌面容器 | Electron v33 |
| 前端 UI | React 18 |
| 程式碼產生 | Node.js + EJS 樣板 |
| IPC 通訊 | Electron contextBridge |
| 資料庫連線 | mysql2 / pg / mssql（主程序） |

---

<a name="english-documentation"></a>

# API Generator — English Documentation

**No-Code RESTful API Generator** — Design REST APIs visually, preview code in real-time, and export complete deployable projects — no programming required.

Supports **Node.js (Express 4/5)**, **Python (FastAPI + Pydantic v1/v2)**, **C# (ASP.NET Core 3.1/5/6/8)**, and **Java (Spring Boot 2.7/3.2)**.

---

## Features

| Feature | Description |
|---------|-------------|
| API Designer | Visually create/edit REST APIs (Method, Path, Description) |
| Schema Builder | Define Request/Response JSON schemas with nested object support |
| **🗄 Database Import** | Connect to a database, read table structure, auto-generate CRUD APIs |
| Version Selection | Choose framework version per language for legacy environment compatibility |
| Code Preview | Browse all generated files with syntax highlighting in real-time |
| Export Project | One-click export of a complete, runnable project |

---

## 🗄 Database Import Feature

### Supported Databases

| Database | Driver | Default Port |
|----------|--------|-------------|
| MySQL | `mysql2` (pure JS) | 3306 |
| PostgreSQL | `pg` (pure JS) | 5432 |
| SQLite | `better-sqlite3` | — |
| MS SQL Server | `mssql` (pure JS) | 1433 |
| Oracle | `oracledb` | 1521 |

### How to Use

1. Click **"資料庫匯入" (Database Import)** in the sidebar
2. Select a database type and fill in connection details
3. Click **"Connect and Read Tables"**
4. Check the tables you want to generate APIs for
5. Click **"Import to API Designer"**

For each selected table, the system auto-generates 5 CRUD endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tablename` | List all records |
| GET | `/tablename/:id` | Get one by ID |
| POST | `/tablename` | Create new record |
| PUT | `/tablename/:id` | Update record |
| DELETE | `/tablename/:id` | Delete record |

### Generated Code Features

When exporting with a database connection configured, the project includes:

- **`db/index.js`** — Database connection pool setup (Node.js)
- **`.env`** — Environment variables with DB credentials
- **`.gitignore`** — Excludes `.env` from source control
- **Controllers** — Real SQL queries (not TODO placeholders)

Database library mapping per language/DB:

| Language | Library |
|----------|---------|
| Node.js + MySQL | `mysql2/promise` + connection pool |
| Node.js + PostgreSQL | `pg` + Pool |
| Node.js + SQLite | `better-sqlite3` (synchronous) |
| Node.js + MSSQL | `mssql` + poolPromise |
| Node.js + Oracle | `oracledb` + getConnection |
| Python + MySQL/PG/SQLite | `databases` (async) |
| Python + MSSQL | `pyodbc` (sync) |
| Python + Oracle | `cx_Oracle` (sync) |
| C# | Dapper + ADO.NET provider |
| Java | Spring Data JDBC + JdbcTemplate |

### SQLite / Oracle Installation Notes

SQLite and Oracle Node.js drivers require native compilation:

```bash
# SQLite
npm install better-sqlite3
npx electron-rebuild

# Oracle (also requires Oracle Instant Client installed separately)
npm install oracledb
npx electron-rebuild
```

---

## Version Selection

### Node.js (Express)

| Version | Badge | Min Requirement | Notes |
|---------|-------|----------------|-------|
| `express4` (default) | Latest | Node.js 14+ | Widely used, most stable |
| `express5` | Stable | Node.js 18+ | Async error auto-forwarding |

### Python (FastAPI)

| Version | Badge | Min Requirement | Notes |
|---------|-------|----------------|-------|
| `pydantic2` (default) | Latest | Python 3.10+ | Pydantic v2 type system |
| `pydantic1` | LTS | Python 3.8+ | Broad compatibility |
| `legacy` | Legacy | Python 3.7+ | FastAPI 0.68+ / Pydantic v1 |

### C# (ASP.NET Core)

| Version | Badge | Min Requirement |
|---------|-------|----------------|
| `net8` (default) | LTS | .NET 8.0 SDK |
| `net6` | LTS | .NET 6.0 SDK |
| `net5` | EOL | .NET 5.0 SDK |
| `net31` | EOL | .NET Core 3.1 SDK |

### Java (Spring Boot)

| Version | Badge | Min Requirement |
|---------|-------|----------------|
| `springboot3` (default) | Latest | Java 17+, Maven 3.6+ |
| `springboot2` | Stable | Java 11+, Maven 3.6+ |

---

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Launch the application
npm run launch
# or
node launcher.js
```

---

## Running Tests

```bash
# All tests (including database feature tests)
node tests/run-tests.js

# Individual suites
npm run test:node      # Node.js generator
npm run test:python    # Python generator
npm run test:csharp    # C# generator
npm run test:database  # Database import feature (70 tests)
```

**Test coverage (155+ tests total):**
- Node.js generator: 15 tests
- Python generator: 21 tests
- C# generator: 23 tests
- Java generator: 26 tests
- Integration (disk I/O): 13 tests
- Version variance: 34 tests
- Database feature: 70 tests (type mapping, SQL generation, 5 databases)

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Desktop container | Electron v33 |
| Frontend UI | React 18 |
| Code generation | Node.js + EJS templates |
| IPC communication | Electron contextBridge |
| DB connectivity | mysql2 / pg / mssql (main process) |
