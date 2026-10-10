#!/bin/bash
# ==============================================================================
# TANBOX Server Bootstrap Script for Ubuntu (2 CPU / 4GB RAM / 50GB SSD)
# ==============================================================================
# Этот скрипт подготавливает чистый сервер Ubuntu в один клик:
# 1. Создает 4 ГБ Swap (критично для 4 ГБ ОЗУ)
# 2. Устанавливает официальный Docker и Docker Compose
# 3. Настраивает фаервол UFW (порты 22, 80, 443)
# 4. Тюнит параметры ядра Linux под высокие сетевые нагрузки и Docker
# 5. Настраивает ночной автобэкап базы данных в cron (03:00)
# ==============================================================================

set -e

# Проверка запуска от root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Ошибка: Скрипт необходимо запускать от root (sudo bash setup-server.sh)"
  exit 1
fi

echo "=============================================================================="
echo "🚀 [TANBOX] Подготовка сервера Ubuntu к боевому развертыванию..."
echo "=============================================================================="

# 1. Обновление пакетов
echo "📦 [1/6] Обновление системных репозиториев..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# 2. Установка необходимых базовых утилит
echo "🛠️ [2/6] Установка базовых утилит (git, curl, ufw, fail2ban, htop, jq)..."
apt-get install -y -qq git curl ufw fail2ban htop jq ca-certificates gnupg lsb-release

# 3. Настройка 4 ГБ файла подкачки (SWAP)
echo "💾 [3/6] Проверка и настройка 4 ГБ SWAP (защита от Out-of-Memory)..."
if ! grep -q '/swapfile' /etc/fstab; then
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ 4 ГБ SWAP успешно создан и активирован."
else
    echo "ℹ️ SWAP уже настроен, пропускаем."
fi

# 4. Тюнинг системных параметров ядра (sysctl)
echo "⚙️ [4/6] Тюнинг ядра Linux (swappiness, лимиты файлов)..."
cat << 'EOF' > /etc/sysctl.d/99-tanbox.conf
# Использовать SWAP только при острой нехватке памяти (10%)
vm.swappiness = 10
# Увеличение лимитов на файловые дескрипторы для Docker
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 8192
# Оптимизация сети
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
EOF
sysctl --system > /dev/null 2>&1

# 5. Установка официального Docker и Docker Compose
echo "🐳 [5/6] Установка официального Docker Engine..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker успешно установлен: $(docker --version)"
else
    echo "ℹ️ Docker уже установлен: $(docker --version)"
fi

# 6. Настройка безопасности (Фаервол UFW)
echo "🛡️ [6/6] Настройка фаервола UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy LetEncrypt)'
ufw allow 443/tcp comment 'HTTPS (Caddy SSL)'
# Включение UFW без интерактивного вопроса
echo "y" | ufw enable || true

# 7. Настройка автобэкапа базы данных в cron (каждую ночь в 03:00)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup-db.sh"

if [ -f "$BACKUP_SCRIPT" ]; then
    chmod +x "$BACKUP_SCRIPT"
    CRON_CMD="0 3 * * * cd $PROJECT_DIR && bash scripts/backup-db.sh >> /var/log/tanbox-backup.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "backup-db.sh" ; echo "$CRON_CMD") | crontab -
    echo "⏰ Ночной автобэкап базы данных (03:00) добавлен в crontab."
fi

echo ""
echo "=============================================================================="
echo "✅ Сервер полностью подготовлен к бою!"
echo "=============================================================================="
echo "Теперь для первого запуска проекта выполните:"
echo ""
echo "   cd $PROJECT_DIR"
echo "   bash scripts/deploy.sh"
echo ""
echo "=============================================================================="
