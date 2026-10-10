#!/bin/bash
# ==============================================================================
# TANBOX Production Deployment Script (2 CPU / 4GB RAM Optimized)
# ==============================================================================

set -e

echo "🚀 [TANBOX] Начинаем боевой деплой..."

# 1. Проверка наличия .env файла
if [ ! -f ".env" ]; then
    echo "⚠️ Файл .env не найден! Создаю базовый .env из .env.example..."
    cp .env.example .env
    # Генерация случайного безопасного JWT секрета
    RANDOM_JWT=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
    sed -i "s|tanbox_kz_jwt_secret_key_super_secure_2026|$RANDOM_JWT|g" .env
    echo "✅ Файл .env успешно создан со случайным JWT_SECRET."
fi

# 2. Сборка оптимизированных продакшн-контейнеров
echo "🔨 [TANBOX] Сборка продакшн Docker-контейнеров..."
docker compose build

# 3. Синхронизация структуры БД и сидинг
echo "🗄️ [TANBOX] Проверка и синхронизация базы данных..."
docker compose run --rm backend npx prisma db push --accept-data-loss
docker compose run --rm backend npx tsx prisma/seed.ts

# 4. Запуск всех сервисов в фоновом режиме
echo "🚢 [TANBOX] Запуск продакшн-стека..."
docker compose up -d

# 5. Очистка неиспользуемых старых образов для экономии диска (50 ГБ SSD)
echo "🧹 [TANBOX] Очистка кэша старых слоев Docker..."
docker image prune -f > /dev/null 2>&1 || true

# 6. Статус запущенных сервисов
echo "=============================================================================="
echo "🎉 Продакшн успешно запущен и работает!"
echo "=============================================================================="
docker compose ps

echo ""
echo "🌐 Главная:            https://tanbox.kz"
echo "🌐 Личный кабинет:     https://lk.tanbox.kz"
echo "🌐 Панель админа:      https://admin.tanbox.kz"
echo "🌐 API Healthcheck:    https://api.tanbox.kz/api/health"
echo "=============================================================================="
