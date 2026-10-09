@echo off
chcp 65001 > nul
echo ==============================================================================
echo 🚀 Запуск TANBOX в PROD-режиме (Nginx + Оптимизированные сборки + Caddy SSL)
echo ==============================================================================
docker compose up --build -d
echo.
echo ✅ Production сервисы запущены!
docker compose ps
pause
