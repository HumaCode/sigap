#!/bin/bash
set -e

# Copy .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.docker.example..."
    cp .env.docker.example .env
fi

# Set proper permissions for Laravel directories
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Ensure PHP has adequate memory limit for Octane and high concurrency
echo "memory_limit = 512M" > /usr/local/etc/php/conf.d/docker-php-memory-limit.ini 2>/dev/null || true

# Run composer install if vendor directory is missing
if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
    echo "Running composer install..."
    composer install --no-dev --no-interaction --optimize-autoloader --ignore-platform-req=php+
fi

# Run key:generate if APP_KEY is not set, empty, or invalid length (must be 51 chars)
CURRENT_KEY=$(grep -E '^APP_KEY=' .env 2>/dev/null | cut -d '=' -f2- | tr -d ' "\r\n')
if [ ${#CURRENT_KEY} -ne 51 ] || ! echo "$CURRENT_KEY" | grep -q '^base64:'; then
    echo "Generating valid application key..."
    NEW_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
    if grep -q '^APP_KEY=' .env 2>/dev/null; then
        sed -i "s|^APP_KEY=.*|APP_KEY=${NEW_KEY}|g" .env
    else
        echo "APP_KEY=${NEW_KEY}" >> .env
    fi
    CURRENT_KEY="$NEW_KEY"
fi
export APP_KEY="$CURRENT_KEY"

# Create symlink storage
php artisan storage:link --force 2>/dev/null || true

# Wait for database connection
echo "Waiting for database connection..."
for i in {1..30}; do
    if php artisan db:show > /dev/null 2>&1; then
        echo "Database is ready!"
        break
    fi
    echo "Database is not ready yet, waiting..."
    sleep 2
done

# Run migrations and cache clear for the main app container only
if [ $# -eq 0 ]; then
    echo "Running migrations..."
    php artisan migrate --force
    php artisan optimize:clear
fi

# Auto-compile Vite assets for production if they don't exist
if [ ! -f public/build/manifest.json ]; then
    echo "Compiled assets not found. Building Vite assets for production..."
    if [ ! -d node_modules ] || [ -z "$(ls -A node_modules)" ]; then
        echo "Installing npm dependencies..."
        npm install --no-audit --prefer-offline || npm install
    fi
    echo "Compiling Vite assets..."
    npx vite build
fi

# If a custom command was passed (like queue or scheduler), run it
if [ $# -gt 0 ]; then
    echo "Executing custom command: $@"
    exec "$@"
else
    echo "Starting FrankenPHP Octane (Production)..."
    exec php artisan octane:start --host=0.0.0.0 --port=8000 --server=frankenphp
fi
