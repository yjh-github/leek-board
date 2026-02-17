#!/bin/bash

echo "====================================="
echo "      基金看板 - 一键启动"
echo "====================================="
echo ""

cd "$(dirname "$0")"

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd client && npm install && cd ..
fi

echo ""
echo "🚀 启动服务..."
echo ""

osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && cd server && npm run dev"'

sleep 2

osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && cd client && npm run dev"'

echo ""
echo "====================================="
echo "✅ 启动完成！"
echo ""
echo "后端地址: http://localhost:3001"
echo "前端地址: http://localhost:5173"
echo ""
echo "请在浏览器中打开前端地址使用"
echo "====================================="
