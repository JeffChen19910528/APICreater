#!/bin/bash

# API Generator — macOS / Linux 一鍵啟動

# 切換到腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo ""
    echo "  [錯誤] 找不到 Node.js！"
    echo "  請至 https://nodejs.org 下載並安裝 Node.js v18 以上版本"
    echo ""
    # macOS：顯示 GUI 提示
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'display dialog "找不到 Node.js！\n請至 https://nodejs.org 下載安裝" buttons {"確定"} default button 1 with icon stop'
    fi
    exit 1
fi

# 執行啟動器
node launcher.js
