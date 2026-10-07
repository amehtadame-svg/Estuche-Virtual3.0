#!/bin/sh
set -e

echo "🔧 Generating Prisma Client..."
pnpm prisma generate

echo "⏳ Waiting for database to be ready..."
n=0
while [ $n -lt 30 ]; do
  if pnpm prisma migrate deploy 2>/dev/null; then
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

echo "🌱 Running seed..."
pnpm prisma db seed 2>/dev/null || echo "  (seed skipped or already applied)"

echo "🚀 Starting development server..."
exec pnpm dev