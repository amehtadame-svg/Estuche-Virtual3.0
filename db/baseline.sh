#!/usr/bin/env bash
# Marca las migraciones de Prisma como aplicadas (ejecutar UNA vez).
set -euo pipefail

MIGRATIONS=(
  "20260813000000_uuid_v7_function"
  "20260814053836_init"
)

echo "== Baselinando migraciones de Prisma =="
for m in "${MIGRATIONS[@]}"; do
  echo "  -> marcando $m como aplicada..."
  docker compose exec backend pnpm prisma migrate resolve --applied "$m"
done
echo ""
echo "== Verificación =="
docker compose exec backend pnpm prisma migrate status
