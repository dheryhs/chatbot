#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running database migrations..."
# Invoke prisma CLI directly from node_modules/prisma
node ./node_modules/prisma/build/index.js migrate deploy

echo "Starting application..."
exec "$@"
