#!/bin/bash

echo "====================================="
echo "      基金看板 - 停止服务"
echo "====================================="
echo ""

echo "正在停止后端服务..."
pkill -f "ts-node src/index.ts" 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "正在停止前端服务..."
pkill -f "vite" 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

echo ""
echo "====================================="
echo "✅ 服务已停止"
echo "====================================="
