#!/usr/bin/env node
/**
 * API Generator 測試執行器
 * 執行方式：node tests/run-tests.js
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m'
};

const TEST_FILES = [
  { name: 'Node.js Generator',  file: 'tests/nodejs.test.js' },
  { name: 'Python Generator',   file: 'tests/python.test.js' },
  { name: 'C# Generator',       file: 'tests/csharp.test.js' },
  { name: 'Java Generator',     file: 'tests/java.test.js' },
  { name: 'Integration (磁碟)', file: 'tests/integration.test.js' },
  { name: '版本差異測試',        file: 'tests/version.test.js' },
  { name: '資料庫匯入功能',      file: 'tests/database.test.js' }
];

console.log('');
console.log(`${C.bold}${C.cyan}╔════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║   API Generator — 測試套件 v2          ║${C.reset}`);
console.log(`${C.bold}${C.cyan}║   Node.js / Python / C# / Java         ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════╝${C.reset}`);
console.log('');

let totalPass = 0;
let totalFail = 0;
let totalSkip = 0;
const results = [];

for (const suite of TEST_FILES) {
  const filePath = path.join(ROOT, suite.file);

  if (!fs.existsSync(filePath)) {
    console.log(`${C.yellow}[跳過] ${suite.name} — 找不到 ${suite.file}${C.reset}`);
    continue;
  }

  console.log(`${C.bold}${C.white}▶ ${suite.name}${C.reset}`);
  console.log(`${C.gray}  ${suite.file}${C.reset}`);

  const result = spawnSync(
    process.execPath,
    ['--test', filePath],
    {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60000
    }
  );

  const output = (result.stdout || '') + (result.stderr || '');

  // 解析 node:test 輸出
  const passMatches  = output.match(/# tests (\d+)/);
  const failMatches  = output.match(/# fail (\d+)/);
  const skipMatches  = output.match(/# skip (\d+)/);
  const passCount    = passMatches ? parseInt(passMatches[1]) : 0;
  const failCount    = failMatches ? parseInt(failMatches[1]) : 0;
  const skipCount    = skipMatches ? parseInt(skipMatches[1]) : 0;
  const success      = result.status === 0;

  // 顯示每個 test case 結果
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('ok ') && line.match(/^\s*ok \d+/)) {
      const name = line.replace(/^\s*ok \d+ - /, '').trim();
      console.log(`  ${C.green}✓${C.reset} ${C.gray}${name}${C.reset}`);
    } else if (line.includes('not ok ') && line.match(/^\s*not ok \d+/)) {
      const name = line.replace(/^\s*not ok \d+ - /, '').trim();
      console.log(`  ${C.red}✕${C.reset} ${C.red}${name}${C.reset}`);
    } else if (line.includes('# Subtest:') || line.match(/^#\s+[A-Z]/)) {
      // 顯示 describe 名稱
      const suiteName = line.replace(/^#\s+(Subtest:\s*)?/, '').trim();
      if (suiteName && !suiteName.startsWith('tests') && !suiteName.match(/^\d/)) {
        console.log(`  ${C.cyan}${suiteName}${C.reset}`);
      }
    }
  }

  // 顯示錯誤詳情
  if (!success) {
    const errorLines = lines.filter(l =>
      l.includes('AssertionError') ||
      l.includes('Error:') ||
      (l.includes('at ') && !l.includes('node_modules'))
    ).slice(0, 8);

    if (errorLines.length > 0) {
      console.log(`\n  ${C.red}錯誤詳情：${C.reset}`);
      errorLines.forEach(l => console.log(`  ${C.red}${l}${C.reset}`));
    }
  }

  const statusIcon = success ? `${C.green}✓ PASS` : `${C.red}✕ FAIL`;
  console.log(`\n  ${statusIcon} — 通過: ${passCount}  失敗: ${failCount}  跳過: ${skipCount}${C.reset}`);
  console.log('');

  totalPass += passCount;
  totalFail += failCount;
  totalSkip += skipCount;
  results.push({ ...suite, success, passCount, failCount, skipCount });
}

// ─── 最終摘要 ─────────────────────────────────────────────────────────────────

console.log(`${C.bold}${C.cyan}══════════════════════════════════════${C.reset}`);
console.log(`${C.bold}  測試結果摘要${C.reset}`);
console.log(`${C.bold}${C.cyan}══════════════════════════════════════${C.reset}`);
console.log('');

for (const r of results) {
  const icon = r.success ? `${C.green}✓` : `${C.red}✕`;
  console.log(`  ${icon} ${r.name.padEnd(22)}${C.reset} ${C.green}${r.passCount} 通過${C.reset}  ${r.failCount > 0 ? C.red : C.gray}${r.failCount} 失敗${C.reset}`);
}

console.log('');
console.log(`  總計：${C.green}${C.bold}${totalPass} 通過${C.reset}  ${totalFail > 0 ? C.red + C.bold : C.gray}${totalFail} 失敗${C.reset}  ${C.gray}${totalSkip} 跳過${C.reset}`);
console.log('');

if (totalFail === 0) {
  console.log(`${C.bold}${C.green}  所有測試通過！${C.reset}`);
} else {
  console.log(`${C.bold}${C.red}  有 ${totalFail} 個測試失敗，請查看上方錯誤訊息${C.reset}`);
}
console.log('');

process.exit(totalFail > 0 ? 1 : 0);
