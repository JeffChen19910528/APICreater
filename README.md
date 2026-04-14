# API Generator

**No-Code RESTful API Generator** — 不需寫程式碼，透過 GUI 設計 REST API，即時預覽，一鍵產生可部署專案。

支援四種語言 × 多個版本：**Node.js (Express 4/5)**、**Python (FastAPI + Pydantic v1/v2)**、**C# (ASP.NET Core 3.1 / 5 / 6 / 8)**、**Java (Spring Boot 2.7 / 3.2)**

---

## 功能一覽

| 功能 | 說明 |
|------|------|
| API 設計器 | 視覺化新增／編輯 REST API（Method、Path、Description） |
| Schema Builder | 設定 Request / Response JSON 結構，支援 nested object、型別選單 |
| **版本選擇** | 依語言選擇 Framework 版本，相容舊伺服器部署環境 |
| 程式碼預覽 | 即時瀏覽產生的所有檔案，含語法高亮（JS / Python / C# / Java） |
| 匯出專案 | 選擇資料夾，一鍵輸出完整可執行專案（三種語言皆支援） |

---

## 版本選擇

選定語言後，側欄會顯示可用版本卡片，每張卡片標示徽章與最低環境需求：

### Node.js (Express)

| 版本 | 徽章 | 最低需求 | 說明 |
|------|------|---------|------|
| `express4`（預設） | Latest | Node.js 14+ | Express 4.x — 廣泛使用，最穩定 |
| `express5` | Stable | Node.js 18+ | Express 5.x — async 錯誤自動轉送 |

### Python (FastAPI)

| 版本 | 徽章 | 最低需求 | 說明 |
|------|------|---------|------|
| `pydantic2`（預設） | Latest | Python 3.10+ | FastAPI 0.115+ / Pydantic v2，使用 `list[Any]` |
| `pydantic1` | Stable | Python 3.8+ | FastAPI 0.95+ / Pydantic v1，使用 `class Config: orm_mode` |
| `legacy` | Legacy | Python 3.7+ | FastAPI 0.68+ / Pydantic v1，適合舊伺服器 |

### C# (ASP.NET Core)

| 版本 | 徽章 | 目標框架 | 說明 |
|------|------|---------|------|
| `net8`（預設） | Latest | net8.0 | Minimal Hosting，Swashbuckle 6.5 |
| `net6` | LTS | net6.0 | Minimal Hosting，Swashbuckle 6.4 |
| `net5` | EOL | net5.0 | Minimal Hosting，Swashbuckle 5.6 |
| `net31` | Legacy | netcoreapp3.1 | Startup.cs 模式，適合舊伺服器 |

> net31 會額外產生 `Startup.cs`（含 `ConfigureServices` + `Configure`）

### Java (Spring Boot)

| 版本 | 徽章 | 最低需求 | 說明 |
|------|------|---------|------|
| `springboot3`（預設） | Latest | Java 17+ | Spring Boot 3.2 · Jakarta EE，springdoc 2.x |
| `springboot2` | Stable | Java 11+ | Spring Boot 2.7 · javax.*，springdoc 1.x |

---

## 技術架構

```
Electron (桌面容器)
 ├── Main Process (Node.js)
 │     ├── main/main.js          — 視窗管理、IPC handlers、檔案系統
 │     ├── main/preload.js       — contextBridge 安全橋接
 │     └── generator/
 │           ├── codeBuilder.js   — 入口，依語言 + 版本分派
 │           ├── pythonBuilder.js — Python FastAPI 產生器（Pydantic v1/v2）
 │           ├── csharpBuilder.js — C# ASP.NET Core 產生器（net8/6/5/3.1）
 │           └── javaBuilder.js   — Java Spring Boot 產生器（3.2 / 2.7）
 └── Renderer (React UI)
       ├── src/utils/
       │     └── versions.js      — 版本設定（各語言可選版本、徽章、描述）
       ├── src/components/
       │     ├── Sidebar.js       — 語言按鈕 + 版本卡片選擇器
       │     └── SchemaBuilder.js — JSON Schema 視覺化編輯器
       └── src/pages/
             ├── ApiDesigner.js   — API 列表 + 表單編輯器
             ├── CodePreview.js   — 多語言語法高亮、檔案樹瀏覽
             └── ExportPage.js    — 匯出設定 + 版本資訊 + 一鍵產生
```

---

## 安裝與執行

### 唯一前置需求

安裝 **Node.js v18+**（建議 v22）：[https://nodejs.org](https://nodejs.org)

> npm 隨 Node.js 一起安裝，不需額外安裝其他工具。

---

### 一鍵啟動（推薦）

首次執行會自動安裝依賴並 build，之後每次啟動只需幾秒。

**Windows — 雙擊 `start.bat`**

**macOS — 雙擊 `start.command`**
> 第一次需先在終端機執行：`chmod +x start.command`

**Linux / 終端機通用：**
```bash
./start.sh
# 或
node launcher.js
# 或
npm run launch
```

啟動器會自動完成：
1. 檢查 Node.js 版本
2. 安裝依賴（僅首次，約 2–3 分鐘）
3. 建置 React UI（僅首次或原始碼變更後，約 30–60 秒）
4. 啟動 Electron 視窗

---

### 開發模式（熱重載，給開發者）

```bash
# 終端機 1
set ELECTRON_DEV=true && npx react-scripts start

# 終端機 2（等 http://localhost:3000 啟動後）
set ELECTRON_DEV=true && npx electron .
```

### 打包為安裝檔（.exe / .dmg）

```bash
npm run build
```

打包後的檔案在 `dist/` 目錄中。

---

## 使用教學

### Step 1 — 設定專案

在左側側欄：
- 點擊專案名稱旁的 ✏ 圖示，輸入你的專案名稱
- 點擊語言按鈕選擇目標語言（`Node.js` / `Python` / `C#` / `Java`）
- 從版本卡片選擇部署版本（預設為最新穩定版）

### Step 2 — 設計 API

切換到「**API 設計器**」：

1. 點擊「**+ 新增 API**」
2. 選擇 HTTP Method（GET / POST / PUT / PATCH / DELETE）
3. 輸入路徑，例如 `/users` 或 `/users/:id`
4. 填寫描述（選填）
5. 在「**Request Schema**」設定請求欄位：
   - 點擊「+ 新增欄位」
   - 選擇型別：`string`、`int`、`number`、`boolean`、`array`、`object`
   - 選 `object` 可繼續新增子欄位（nested）
6. 在「**Response Schema**」設定回應欄位（同上）
7. 點擊「**儲存**」

重複新增更多 API。

### Step 3 — 預覽程式碼

切換到「**程式碼預覽**」，左側檔案樹顯示所有產生的檔案，內容會依選擇的版本而不同：

**Node.js：**
```
app.js / routes/ / controllers/ / models/ / package.json
```

**Python：**
```
main.py / requirements.txt / routers/ / models/
```

**C#（net8/6/5）：**
```
Program.cs / *.csproj / appsettings.json / Controllers/ / Models/
```

**C#（net31）：**
```
Program.cs / Startup.cs / *.csproj / appsettings.json / Controllers/ / Models/
```

**Java (Spring Boot)：**
```
pom.xml / src/main/java/{package}/Application.java
src/main/java/{package}/controller/ / src/main/java/{package}/model/
src/main/resources/application.properties
```

### Step 4 — 匯出專案

切換到「**匯出專案**」：

1. 確認 API 列表、語言、版本正確
2. 查看「版本資訊」欄位（顯示啟動指令與預設 Port）
3. 點擊「**瀏覽...**」選擇輸出資料夾
4. 點擊「**產生專案**」

---

## 產生的專案結構

### Node.js (Express 4.x / 5.x)

```
my-api/
  app.js                    ← Express 入口，自動掛載所有路由
  package.json              ← 依版本鎖定 ^4.x 或 ^5.x
  README.md
  routes/usersRoute.js      ← 路由定義
  controllers/usersController.js  ← 端點處理函式（含 sample response）
  models/usersModel.js      ← Schema 文件
```

啟動：
```bash
npm install
npm start        # http://localhost:3000
```

---

### Python (FastAPI + Pydantic v2 / v1 / Legacy)

```
my-api/
  main.py                   ← FastAPI app + CORS + router include
  requirements.txt          ← 依版本鎖定 pydantic / fastapi / uvicorn
  routers/
    __init__.py
    users.py                ← APIRouter + endpoint 函式（v2 用 async def，v1 用 def）
  models/
    __init__.py
    users.py                ← Pydantic BaseModel（v2 無 class Config，v1 有 orm_mode）
  README.md
```

啟動：
```bash
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
                            # Swagger UI: http://localhost:8000/docs
```

---

### C# (ASP.NET Core — net8 / net6 / net5)

```
my-api/
  Program.cs                ← Minimal Hosting（WebApplication.CreateBuilder）
  MyApi.csproj              ← 依版本設定 net8.0 / net6.0 / net5.0
  appsettings.json
  Controllers/
    UsersController.cs      ← [ApiController] + HTTP method attributes
  Models/
    UsersModels.cs          ← Request / Response class（含預設值）
  README.md
```

### C# (ASP.NET Core — net31 舊版)

```
my-api/
  Program.cs                ← CreateHostBuilder 模式
  Startup.cs                ← ConfigureServices + Configure（Startup.cs 模式）
  MyApi.csproj              ← netcoreapp3.1 + Swashbuckle 5.6
  appsettings.json / Controllers/ / Models/ / README.md
```

啟動：
```bash
dotnet restore
dotnet run                  # https://localhost:5001
                            # Swagger UI: https://localhost:5001/swagger
```

---

### Java (Spring Boot 3.2 / 2.7)

```
my-api/
  pom.xml                   ← Maven 建置，依版本設定 Spring Boot 3.2.0 或 2.7.18
  src/main/java/com/myapi/
    Application.java        ← @SpringBootApplication 入口
    controller/
      UsersController.java  ← @RestController + HTTP method annotations
    model/
      GetUsersResponse.java ← POJO（private fields + getter/setter）
      PostUsersRequest.java
  src/main/resources/
    application.properties  ← server.port=8080 + springdoc 路徑設定
  README.md
```

啟動：
```bash
mvn spring-boot:run         # http://localhost:8080
                            # Swagger UI: http://localhost:8080/swagger-ui.html
```

---

## 測試

```bash
node tests/run-tests.js
```

| 測試套件 | 測試數 |
|---------|--------|
| Node.js Generator | 15 |
| Python Generator | 21 |
| C# Generator | 23 |
| Java Generator | 26 |
| Integration（磁碟寫檔） | 13 |
| 版本差異測試（含 Java） | 34 |
| **總計** | **132** |

---

## 常見問題

**Q: npm install 出現 ENOTEMPTY 錯誤？**  
A: 執行 `rm -rf node_modules && npm install --legacy-peer-deps`。

**Q: Electron 視窗開啟但畫面空白？**  
A: 先執行 `npx react-scripts build`，再啟動 `npx electron .`。

**Q: 開發模式下，Electron 視窗空白？**  
A: 確認 React dev server（`http://localhost:3000`）已啟動，且已設定 `ELECTRON_DEV=true`。

**Q: 產生的 Python 專案，pydantic1 和 pydantic2 有什麼差別？**  
A: pydantic2 使用 `async def`、`list[Any]`（Python 3.10+ 原生泛型）；pydantic1 使用 `def`、`List[Any]`，並在 Model 加 `class Config: orm_mode = True`。

**Q: 產生的 C# 專案，net31 和 net8 有什麼差別？**  
A: net31 使用 `Startup.cs` 模式（`ConfigureServices` + `Configure`）；net8/6/5 使用 Minimal Hosting（`WebApplication.CreateBuilder`）。

**Q: 產生的 Java 專案，Spring Boot 3 和 2 有什麼差別？**  
A: Spring Boot 3.2 需要 Java 17+，使用 `jakarta.*` 套件與 springdoc 2.x；Spring Boot 2.7 需要 Java 11+，使用 `javax.*` 套件與 springdoc 1.x。

**Q: 產生的 Java 專案如何執行？**  
A: 需先安裝 **Java 17+**（springboot3）或 **Java 11+**（springboot2）與 **Maven 3.6+**，然後執行 `mvn spring-boot:run`。

**Q: 產生的 C# 專案如何加入資料庫？**  
A: 在 Controller 方法中注入 DbContext，並在 Program.cs 加入 `builder.Services.AddDbContext<>()`。

---

## 路線圖

- [x] Node.js Express 程式碼產生器
- [x] Python FastAPI 程式碼產生器（Pydantic v1 / v2）
- [x] C# ASP.NET Core 程式碼產生器（net8 / net6 / net5 / net31）
- [x] **Java Spring Boot 程式碼產生器**（Spring Boot 3.2 / 2.7）
- [x] **版本選擇**（相容舊伺服器部署環境）
- [x] 132 項自動化測試（含版本差異測試）
- [ ] 專案匯出為 ZIP 壓縮檔
- [ ] Swagger / OpenAPI 匯入匯出
- [ ] 資料庫連線設定（MongoDB / MySQL / PostgreSQL）
- [ ] API 測試面板（內建 HTTP Client）
- [ ] 部署設定產生器（pm2.config.js / nginx.conf / Dockerfile）
