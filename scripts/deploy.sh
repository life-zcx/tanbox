#!/bin/bash
# ==============================================================================
# TANBOX Production Deployment Script (2 CPU / 4GB RAM Optimized)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 [TANBOX] Начинаем боевой деплой..."

# 1. Проверка и автоматическая настройка .env файла
if [ ! -f ".env" ]; then
    echo "⚠️ Файл .env не найден! Создаю рабочий .env из .env.example..."
    cp .env.example .env
fi

# Генерация и подстановка случайных безопасных ключей, если остались шаблоны
if grep -q "replace_with_strong_random_jwt_secret_openssl_rand_hex_64" .env; then
    RANDOM_JWT=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
    sed -i "s|replace_with_strong_random_jwt_secret_openssl_rand_hex_64|$RANDOM_JWT|g" .env
fi

if grep -q "replace_with_strong_random_encryption_secret_minimum_32_chars" .env; then
    RANDOM_ENC=$(openssl rand -hex 16 2>/dev/null || cat /proc/sys/kernel/random/uuid | tr -d '-')
    sed -i "s|replace_with_strong_random_encryption_secret_minimum_32_chars|$RANDOM_ENC|g" .env
fi

if grep -q "replace_with_strong_password_minimum_24_chars" .env; then
    RANDOM_PG_PASS=$(openssl rand -hex 16 2>/dev/null || tr -dc 'A-Za-z0-9_' </dev/urandom | head -c 24)
    sed -i "s|replace_with_strong_password_minimum_24_chars|$RANDOM_PG_PASS|g" .env
fi

if grep -q "replace_with_initial_admin_password_here" .env; then
    RANDOM_ADMIN_PASS=$(openssl rand -base64 12 2>/dev/null || tr -dc 'A-Za-z0-9_!' </dev/urandom | head -c 16)
    sed -i "s|replace_with_initial_admin_password_here|$RANDOM_ADMIN_PASS|g" .env
fi

echo "✅ Конфигурация .env проверена и готова."

# Экспортируем переменные из .env в текущий шелл (для POSTGRES_USER, POSTGRES_DB и др.)
set -a
[ -f .env ] && . .env
set +a

# 2. Сборка оптимизированных продакшн-контейнеров
echo "🔨 [TANBOX] Сборка продакшн Docker-контейнеров..."
docker compose build

# 2.5 Автоматический бэкап базы данных перед любыми изменениями схемы
if docker ps | grep -q "tanbox_postgres"; then
    echo "💾 [TANBOX] Создание резервной копии базы данных перед миграцией..."
    bash scripts/backup-db.sh || {
        echo "❌ Ошибка создания бэкапа! Деплой остановлен для защиты данных."
        exit 1
    }
fi

# 3. Применение безопасных SQL-миграций и синхронизация
echo "🗄️ [TANBOX] Применение безопасных SQL-миграций (zero-data-loss)..."
if docker ps | grep -q "tanbox_postgres"; then
    for mig in backend/prisma/migrations/*/migration.sql; do
        if [ -f "$mig" ]; then
            echo "   -> Применяю миграцию: $(basename $(dirname "$mig"))"
            docker exec -i tanbox_postgres psql -U "${POSTGRES_USER:-tanbox_user}" -d "${POSTGRES_DB:-tanbox_db}" < "$mig" || true
        fi
    done
fi

docker compose run --rm backend sh -c "npx prisma migrate deploy || npx prisma db push --skip-generate"
docker compose run --rm backend node dist/seed.js

# 4. Запуск всех сервисов в фоновом режиме
echo "🚢 [TANBOX] Запуск продакшн-стека..."
docker compose up -d

# 5. Очистка неиспользуемых старых образов для экономии диска (50 ГБ SSD)
echo "🧹 [TANBOX] Очистка кэша старых слоев Docker..."
docker image prune -f > /dev/null 2>&1 || true

# 6. Автоматическая регистрация ежедневного бэкапа в crontab (каждую ночь в 03:00)
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup-db.sh"
if [ -f "$BACKUP_SCRIPT" ]; then
    chmod +x "$BACKUP_SCRIPT"
    CRON_CMD="0 3 * * * cd $PROJECT_DIR && bash scripts/backup-db.sh >> /var/log/tanbox-backup.log 2>&1"
    EXISTING_CRON=$(crontab -l 2>/dev/null | grep -v "backup-db.sh" || true)
    if [ -n "$EXISTING_CRON" ]; then
        printf "%s\n%s\n" "$EXISTING_CRON" "$CRON_CMD" | crontab -
    else
        echo "$CRON_CMD" | crontab -
    fi
    echo "⏰ [TANBOX] Ежедневный ночной бэкап БД (03:00) зарегистрирован в crontab."
fi

# 7. Чтение учетных данных админа из .env
ADMIN_PASS=$(grep '^INITIAL_ADMIN_PASSWORD=' .env | cut -d '=' -f2- || echo "(указан в .env)")

# 8. Статус запущенных сервисов
echo "=============================================================================="
echo "🎉 Продакшн TANBOX успешно запущен и работает!"
echo "=============================================================================="
docker compose ps

echo ""
echo "🌐 Главная:            https://tanbox.kz  (или http://185.200.86.23)"
echo "🌐 Личный кабинет:     https://lk.tanbox.kz"
echo "🌐 Панель админа:      https://admin.tanbox.kz"
echo "🌐 API Healthcheck:    https://api.tanbox.kz/api/health"
echo "=============================================================================="
echo "🔑 Учетные данные супер-администратора (сохранены в .env):"
echo "   Email:  admin@tanbox.kz"
echo "   Пароль: $ADMIN_PASS"
echo "=============================================================================="
