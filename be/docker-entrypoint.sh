#!/bin/sh
set -e

# Arranque del contenedor del backend.
#
# Regla de oro: las migraciones son la ÚNICA fuente de verdad del esquema.
#   - NO se ejecuta `prisma migrate reset` (borra todos los datos).
#   - NO se ejecuta `prisma db push` (ignora las migraciones).
#   - El seed es idempotente y no destructivo: no reescribe roles,
#     contraseñas ni stock de lo que ya existe (ver prisma/seed.ts).
#
# Variables:
#   RUN_SEED=false  -> no ejecuta el seed en el arranque (por defecto: true)

echo "🔧 Generating Prisma Client..."
pnpm prisma generate

echo "⏳ Waiting for database to be ready..."
n=0
while [ $n -lt 30 ]; do
  # `migrate deploy` solo aplica lo pendiente: nunca borra datos existentes.
  if pnpm prisma migrate deploy; then
    echo "✅ Migrations applied successfully!"
    break
  fi
  n=$((n + 1))
  echo "  Attempt $n/30 - DB not ready, retrying in 3s..."
  sleep 3
done

if [ $n -eq 30 ]; then
  echo "❌ Database not reachable after 30 attempts. Exiting."
  exit 1
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "🌱 Running seed (idempotente, no destructivo)..."
  pnpm prisma db seed
else
  echo "🌱 Seed omitido (RUN_SEED=false)."
fi

echo "🚀 Starting development server..."
exec pnpm dev
