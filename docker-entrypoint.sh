#!/bin/sh
set -e

echo "========================================="
echo "  WhatsApp Chatbot - Starting Up"
echo "========================================="

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application on port $PORT..."
exec "$@"