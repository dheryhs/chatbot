#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running database migrations..."
# Use node to run the prisma CLI if npx is not available in the runner
node_modules/.bin/prisma migrate deploy

echo "Starting application..."
exec "$@"
