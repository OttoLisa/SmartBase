#!/bin/sh
if [ ! -f /app/.seeded_vol/.seeded ]; then
  npm run seed
  mkdir -p /app/.seeded_vol
  touch /app/.seeded_vol/.seeded
fi
exec "$@"