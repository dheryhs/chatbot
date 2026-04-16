#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running database migrations..."
# Run prisma migrations
npx prisma migrate deploy

echo "Starting application..."
exec "$@"
