#!/bin/bash
# ==============================================================================
# TANBOX Server Logs Viewer CLI
# ==============================================================================

SERVICE="${1:-backend}"
LINES="${2:-100}"

case "$SERVICE" in
  backend|api)
    echo "📋 Tailing TANBOX Backend API logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f backend
    ;;
  caddy|proxy|web)
    echo "📋 Tailing Caddy Reverse Proxy & HTTPS access logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f caddy
    ;;
  db|postgres)
    echo "📋 Tailing PostgreSQL database logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f postgres
    ;;
  label|labels)
    echo "📋 Tailing Label Generator microservice logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f label-generator
    ;;
  admin)
    echo "📋 Tailing Admin panel container logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f frontend-admin
    ;;
  lk)
    echo "📋 Tailing Client Cabinet container logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f frontend-lk
    ;;
  landing)
    echo "📋 Tailing Landing container logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f frontend-landing
    ;;
  all)
    echo "📋 Tailing ALL stack logs (last $LINES lines)..."
    docker compose logs --tail="$LINES" -f
    ;;
  files|disk)
    echo "📂 Recent backend disk error logs:"
    docker compose exec backend tail -n "$LINES" /app/logs/error.log
    ;;
  *)
    echo "Usage: ./scripts/view-logs.sh [backend|caddy|postgres|label|admin|lk|landing|all|files] [lines_count]"
    echo "Example: ./scripts/view-logs.sh backend 50"
    exit 1
    ;;
esac
