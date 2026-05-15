#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Entrypoint Script..."

# Wait for database to be ready
if [ "$DB_ENGINE" != "sqlite" ]; then
    echo "Waiting for PostgreSQL..."
    while ! nc -z $DB_HOST 5432; do
      sleep 0.1
    done
    echo "PostgreSQL started"
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
exec "$@"
