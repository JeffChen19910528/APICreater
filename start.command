#!/bin/bash
# macOS 雙擊啟動（Finder 可直接執行）

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node &> /dev/null; then
    osascript -e 'display dialog "找不到 Node.js！\n請至 https://nodejs.org 下載 v18 以上版本後重試。" buttons {"確定"} default button 1 with icon stop'
    exit 1
fi

node launcher.js
