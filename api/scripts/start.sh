#!/bin/sh
# Container entrypoint: apply pending migrations, then start the API.
# Neon connection strings include channel_binding=require, which the
# migrate driver (lib/pq) rejects, so it is removed for the migration step.
set -e

MIGRATE_DB=$(printf "%s" "$DB_ADDR" | sed -E "s/&channel_binding=[^&]*//; s/\?channel_binding=[^&]*&?/?/")

echo "running database migrations..."
./migrate -path ./migrations -database "$MIGRATE_DB" up

# Initial data (super admin from ADMIN_EMAIL/ADMIN_PASSWORD, permissions,
# roles, commercial policies). Only seeds an empty database.
if [ "$SEED_ON_START" = "true" ]; then
  echo "running data seed..."
  ./seed || echo "seed failed, starting the API anyway"
fi

exec ./main
