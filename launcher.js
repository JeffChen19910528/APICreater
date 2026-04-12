#!/usr/bin/env node
/**
 * API Generator — 智慧啟動器
 * 自動完成：依賴安裝 → React Build → 啟動 Electron
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ─── 顏色輸出 ─────────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m'
};

function log(icon, color, msg) {
  console.log(`${color}${C.bold}${icon}${C.reset} ${color}${msg}${C.reset}`);
}

function step(msg)  { log('►', C.cyan,   msg); }
function ok(msg)    { log('✓', C.green,  msg); }
function warn(msg)  { log('!', C.yellow, msg); }
function fail(msg)  { log('✕', C.red,    msg); process.exit(1); }
function info(msg)  { log(' ', C.gray,   msg); }

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

// ─── 檢查 Node.js 版本 ────────────────────────────────────────────────────────
function checkNode() {
  const version = process.versions.node;
  const major = parseInt(version.split('.')[0], 10);
  if (major < 18) {
    fail(`需要 Node.js v18 以上，目前版本：v${version}\n請至 https://nodejs.org 下載最新版本`);
  }
  ok(`Node.js v${version}`);
}

// ─── 安裝依賴 ─────────────────────────────────────────────────────────────────
function ensureDeps() {
  const electronBin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
  const reactBin    = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'react-scripts.cmd' : 'react-scripts');

  if (fs.existsSync(electronBin) && fs.existsSync(reactBin)) {
    ok('依賴已安裝');
    return;
  }

  step('安裝依賴（首次執行約需 2–3 分鐘）...');
  try {
    run('npm install --legacy-peer-deps');
    ok('依賴安裝完成');
  } catch {
    fail('npm install 失敗，請確認網路連線後重試');
  }
}

// ─── React Build ──────────────────────────────────────────────────────────────
function ensureBuild() {
  const buildIndex = path.join(ROOT, 'build', 'index.html');

  // 檢查 build 是否存在且比 src 新
  if (fs.existsSync(buildIndex)) {
    const buildTime = fs.statSync(buildIndex).mtimeMs;
    const srcFiles  = getAllFiles(path.join(ROOT, 'src'));
    const latestSrc = srcFiles.reduce((max, f) => {
      const t = fs.statSync(f).mtimeMs;
      return t > max ? t : max;
    }, 0);

    if (buildTime > latestSrc) {
      ok('React build 已是最新');
      return;
    }
    warn('偵測到原始碼變更，重新 build...');
  } else {
    step('建置 React UI（首次約需 30–60 秒）...');
  }

  try {
    run('npx react-scripts build', { env: { ...process.env, GENERATE_SOURCEMAP: 'false', CI: 'false' } });
    ok('React build 完成');
  } catch {
    fail('React build 失敗，請檢查 src/ 目錄中的錯誤');
  }
}

function getAllFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      results.push(...getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// ─── 啟動 Electron ────────────────────────────────────────────────────────────
function launchElectron() {
  step('啟動 API Generator...');
  info('視窗開啟後此終端機會持續運作，關閉應用程式後自動退出');

  try {
    // execSync 會同步等待 Electron 結束，CMD 視窗全程保持開著
    run('npx electron .');
  } catch (e) {
    const code = e.status || 1;
    if (code !== 0) {
      warn(`Electron 結束（exit code ${code}）`);
      process.exit(code);
    }
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`${C.bold}${C.cyan}⚡ API Generator${C.reset}`);
console.log(`${C.gray}  No-Code RESTful API Builder${C.reset}`);
console.log('');

checkNode();
ensureDeps();
ensureBuild();
launchElectron();
