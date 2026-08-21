# No-Code RESTful API Generator — 專案技術文件

## 專案狀態

**四語言 × 多版本 MVP 已完成**，支援 Node.js / Python / C# / Java，各語言可選 Framework 版本，132 項測試全部通過。

---

## 快速建置（新電腦 / 新環境）

### 唯一前置需求
- **Node.js v18+**（建議 v22）：https://nodejs.org

### 一鍵啟動方式

| OS | 方式 |
|----|------|
| Windows | 雙擊 `start.bat` |
| macOS | 雙擊 `start.command`（首次需 `chmod +x start.command`） |
| Linux | 執行 `./start.sh` 或 `node launcher.js` |
| 任意 | `npm run launch` |

啟動器 `launcher.js` 自動完成：
1. 檢查 Node.js 版本（< v18 報錯）
2. 若 `node_modules/.bin/electron` 不存在 → `npm install --legacy-peer-deps`
3. 若 `build/index.html` 不存在，或 `src/` 有比 build 更新的檔案 → `react-scripts build`
4. `spawn npx electron .`（Windows shell mode，macOS/Linux 直接路徑）

### 開發模式（熱重載）

```bash
# 終端機 1
set ELECTRON_DEV=true && npx react-scripts start
# 終端機 2（等 http://localhost:3000 啟動後）
set ELECTRON_DEV=true && npx electron .
```

---

## 專案目標

桌面應用程式（Electron），讓使用者：
- 不需寫程式碼
- 透過 GUI 設計 RESTful API 規格（Method / Path / Schema）
- 選擇目標語言與 **部署版本**（相容舊伺服器環境）
- 即時預覽產生的程式碼
- 一鍵匯出完整可執行專案到本機資料夾

---

## 技術選型（已定案）

| 層級 | 技術 |
|------|------|
| 桌面框架 | **Electron v33** |
| UI | **React 18**（CRA / react-scripts） |
| Code Generator | 純 Node.js（Node.js 用 EJS template，Python / C# 用字串組合） |
| 打包 | electron-builder |

> **不使用** Tauri / WPF / Vite（維持 CRA + Electron 架構）

---

## 專案檔案結構

```
desktop-api-generator/
  main/
    main.js            — Electron 主程序（BrowserWindow、IPC handlers）
    preload.js         — contextBridge 安全橋接
  src/
    generator/
      buildFiles.js    — 純函式產生器（無 fs 依賴，瀏覽器與主程序共用）
      codeBuilder.js   — 主程序專用：呼叫 buildFiles 並寫入磁碟
      shared.js        — 各語言 builder 共用工具（groupByResource、資料表欄位解析）
      pythonBuilder.js — Python FastAPI 產生器（Pydantic v1 / v2 / legacy）
      csharpBuilder.js — C# ASP.NET Core 產生器（net8 / net6 / net5 / net31）
      javaBuilder.js   — Java Spring Boot 產生器（springboot3 / springboot2）
      dbSchemaReader.js — 資料庫 schema 讀取（主程序專用，不會被打包進瀏覽器端）
    App.js             — 頁面路由，管理 language + version state
    utils/
      versions.js      — 各語言可選版本設定（value / label / badge / description）
    components/
      Sidebar.js       — 語言按鈕 + 版本卡片選擇器
      SchemaBuilder.js — JSON Schema 視覺化編輯（nested object 支援）
    pages/
      ApiDesigner.js   — API 列表 + Method/Path/Schema 表單
      CodePreview.js   — 多語言語法高亮、檔案樹瀏覽（直接 import buildFiles，與匯出共用同一份產生邏輯）
      ExportPage.js    — 版本資訊顯示 + 選路徑 → 一鍵產生專案
  tests/
    run-tests.js       — 測試執行器（132 項，含版本差異測試）
    nodejs.test.js     — Node.js Generator 測試（15 項）
    python.test.js     — Python Generator 測試（21 項）
    csharp.test.js     — C# Generator 測試（23 項）
    java.test.js       — Java Generator 測試（26 項）
    integration.test.js — 磁碟寫檔 Integration 測試（13 項）
    version.test.js    — 版本差異測試（34 項，含 Java 版本差異）
    fixtures/
      sampleApis.js    — 共用測試資料（BASIC / MULTI / ALL_TYPES 等）
  public/index.html
  package.json
  README.md
```

---

## IPC 通訊設計

| ipcMain.handle | 說明 |
|----------------|------|
| `select-output-dir` | 開啟系統資料夾選擇對話框 |
| `generate-project` | 呼叫 codeBuilder，寫檔到磁碟（傳入 language + version） |
| `preview-code` | 呼叫 codeBuilder，回傳檔案內容（傳入 language + version） |

Renderer 透過 `window.electronAPI.*` 呼叫（preload 橋接）。

---

## Code Generator 架構

### codeBuilder.js（入口）
- `buildFiles(apis, projectName, language, version)` — 依 language + version 分派
- `generateProject({ apis, projectName, language, version, outputDir })` — 寫入磁碟
- `generatePreview({ apis, projectName, language, version })` — 回傳檔案 Map，不寫磁碟

### pythonBuilder.js — 版本差異

| 版本 | pydantic | async | class Config | list 型別 | 最低 Python |
|------|---------|-------|-------------|-----------|------------|
| `pydantic2` | >=2.0.0 | async def | 無 | `list[Any]` | 3.10 |
| `pydantic1` | >=1.10,<2 | def | 有（orm_mode） | `List[Any]` | 3.8 |
| `legacy` | >=1.6,<2 | def | 有（orm_mode） | `List[Any]` | 3.7 |

### csharpBuilder.js — 版本差異

| 版本 | 目標框架 | Swashbuckle | Hosting 模式 | Startup.cs |
|------|---------|------------|-------------|-----------|
| `net8` | net8.0 | 6.5.0 | Minimal | 無 |
| `net6` | net6.0 | 6.4.0 | Minimal | 無 |
| `net5` | net5.0 | 5.6.3 | Minimal | 無 |
| `net31` | netcoreapp3.1 | 5.6.3 | CreateHostBuilder | 有 |

### javaBuilder.js — 版本差異

| 版本 | Spring Boot | Java | springdoc | EE 套件 |
|------|------------|------|-----------|---------|
| `springboot3` | 3.2.0 | 17 | 2.3.0 | jakarta.* |
| `springboot2` | 2.7.18 | 11 | 1.7.0 | javax.* |

產出結構：`pom.xml` / `Application.java` / `{Resource}Controller.java`（含 `@RestController`、`@PathVariable`、`@RequestBody`）/ `{Action}Request.java` / `{Action}Response.java`（POJO with getter/setter）/ `application.properties`

### src/utils/versions.js
- `LANGUAGE_VERSIONS` — 各語言版本陣列（value / label / description / badge / default）
- `BADGE_COLORS` — Latest / LTS / Stable / EOL / Legacy 顏色映射
- `getDefaultVersion(language)` — 取得語言預設版本
- `getVersionLabel(language, version)` — 取得版本顯示名稱

---

## 各語言產出的啟動方式

| 語言 | 啟動指令 | 預設 URL |
|------|---------|---------|
| Node.js | `npm install && npm start` | http://localhost:3000 |
| Python | `pip install -r requirements.txt && uvicorn main:app --reload` | http://localhost:8000/docs |
| C# | `dotnet restore && dotnet run` | https://localhost:7000/swagger |
| Java | `mvn spring-boot:run` | http://localhost:8080/swagger-ui.html |

---

## 啟動器檔案說明

| 檔案 | 用途 |
|------|------|
| `launcher.js` | 跨平台智慧啟動器（主邏輯） |
| `start.bat` | Windows 雙擊啟動 |
| `start.sh` | macOS / Linux 雙擊啟動 |
| `start.command` | macOS Finder 雙擊啟動（需先 chmod +x） |

---

## 測試執行

```bash
cd desktop-api-generator
node tests/run-tests.js
```

**結果（全部 132 項通過）：**

| 套件 | 項目數 |
|------|-------|
| Node.js Generator | 15 |
| Python Generator | 21 |
| C# Generator | 23 |
| Java Generator | 26 |
| Integration（磁碟） | 13 |
| 版本差異測試（含 Java） | 34 |
| **總計** | **132** |

---

## 已完成功能

- [x] Electron App 初始化（main + preload + contextBridge）
- [x] API 設計器（Method 選擇、Path 輸入、Description）
- [x] Schema Builder（視覺化欄位新增、型別選單、nested object）
- [x] Code Preview（檔案樹、多語言語法高亮：JS / Python / C# / JSON）
- [x] **Node.js Express** code generator（Express 4 / Express 5）
- [x] **Python FastAPI** code generator（Pydantic v2 / v1 / Legacy）
- [x] **C# ASP.NET Core** code generator（net8 / net6 / net5 / net31）
- [x] **Java Spring Boot** code generator（springboot3 / springboot2）
- [x] **版本選擇 UI**（語言按鈕 + 版本卡片，含徽章與描述）
- [x] 版本資訊顯示於匯出頁面（啟動指令 / 預設 Port）
- [x] 本機輸出專案資料夾（IPC + fs 寫檔，四種語言皆支援）
- [x] 一鍵啟動器（launcher.js + start.bat / start.sh / start.command）
- [x] 132 項自動化測試（含版本差異測試 34 項）

---

## 待開發（下一步）

- [ ] 專案匯出為 ZIP 壓縮檔
- [ ] Swagger / OpenAPI 匯入匯出
- [ ] 資料庫連線設定（MongoDB / MySQL / PostgreSQL）
- [ ] API 測試面板（內建 HTTP Client）
- [ ] 部署設定產生器（pm2.config.js / nginx.conf / Dockerfile）

---

## Claude Code 實作指示（務必遵守）

- 使用 **Electron + React（CRA）** 架構，不改變為 Vite
- npm install 一律加 `--legacy-peer-deps`
- UI 與 generator 邏輯分離，但共用同一份程式碼：`src/generator/buildFiles.js` 是唯一的產生邏輯來源，不依賴 `fs`/`path`，Electron 主程序（透過 `codeBuilder.js`）與瀏覽器端 `CodePreview.js` 都直接 import 它 — 兩者不可各自再實作一份 fallback
- 各語言 generator 各自獨立檔案，在 `buildFiles.js` 的 `buildFiles()` 統一分派
- **版本邏輯在 generator 層實作**，UI 只傳 `version` 字串（例如 `'pydantic2'`）
- 版本設定集中在 `src/utils/versions.js`（UI 用）與各 builder 的 `VERSION_CONFIG`（generator 用）
- 所有 API 設定可序列化為 JSON
- IPC 透過 `preload.js` contextBridge 橋接，不開 `nodeIntegration`
- CSS 採每個元件獨立 `.css` 檔案，暗色主題（`#0f1117` 背景）
- `src/generator/` 底下的檔案會被 CRA 打包進瀏覽器端，因此**不可** import `fs`/`path` 或任何 Node-only 套件（`dbSchemaReader.js` 例外，它只被 `main/main.js` 用 `require` 載入，不會進入 React 打包圖）
- 新增語言：新增 `xxxBuilder.js` + 在 `buildFiles.js` 的 `buildFiles()` 加 case + `versions.js` 加語言設定 + `Sidebar.js` 加按鈕 + `ExportPage.js` 加標籤/指令/Port + `CodePreview.js` 加語法高亮/file group
- 新增版本：在對應 builder 的 `VERSION_CONFIG` 加新 key + `versions.js` 加版本卡片
