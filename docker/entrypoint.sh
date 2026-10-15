#!/bin/sh
set -e

echo "[SIGAP] Starting container initialization..."

# 1. Pastikan direktori storage dan cache tersedia
mkdir -p \
  /app/storage/app/public \
  /app/storage/framework/cache/data \
  /app/storage/framework/sessions \
  /app/storage/framework/views \
  /app/storage/logs \
  /app/bootstrap/cache

# 2. Atur izin direktori (permissions) agar www-data dapat menulis log & cache
chown -R www-data:www-data /app/storage /app/bootstrap/cache
chmod -R 775 /app/storage /app/bootstrap/cache

# 3. Cek dependensi Composer & Build frontend jika belum ada (misal di-mount dari host bersih)
if [ ! -f /app/vendor/autoload.php ]; then
    echo "[SIGAP] vendor/autoload.php tidak ditemukan. Menjalankan composer install..."
    composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --ignore-platform-req=php+
fi

if [ ! -f /app/public/build/manifest.json ]; then
    echo "[SIGAP] public/build/manifest.json tidak ditemukan. Menjalankan build frontend (Vite)..."
    if [ ! -d /app/node_modules ]; then
        npm install --no-audit --prefer-offline || npm install
    fi
    npx vite build
fi

# 4. Tunggu database siap (jika DB_HOST dikonfigurasi)
if [ -n "$DB_HOST" ]; then
    echo "[SIGAP] Menunggu koneksi database di ${DB_HOST}:${DB_PORT:-3306}..."
    MAX_TRIES=30
    COUNT=0
    until php -r "
        \$host = getenv('DB_HOST');
        \$port = getenv('DB_PORT') ?: '3306';
        \$db   = getenv('DB_DATABASE');
        \$user = getenv('DB_USERNAME');
        \$pass = getenv('DB_PASSWORD');
        try {
            new PDO(\"mysql:host=\$host;port=\$port;dbname=\$db\", \$user, \$pass, [
                PDO::ATTR_TIMEOUT => 2,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            exit(0);
        } catch (Exception \$e) {
            exit(1);
        }
    " 2>/dev/null; do
        COUNT=$((COUNT+1))
        if [ $COUNT -ge $MAX_TRIES ]; then
            echo "[SIGAP] Peringatan: Database belum siap setelah $MAX_TRIES detik. Melanjutkan eksekusi..."
            break
        fi
        sleep 2
    done
    echo "[SIGAP] Database terhubung dengan baik!"
fi

# 5. Jalankan migrasi dan optimasi hanya pada container Web App (agar tidak balapan dengan scheduler/queue)
case "$*" in
    *octane*|*serve*)
        echo "[SIGAP] Menjalankan konfigurasi awal Web App..."
        
        # Buat symlink storage jika belum ada
        php artisan storage:link --force 2>/dev/null || true
        
        # Pastikan public/frankenphp-worker.php tersedia
        if [ ! -f /app/public/frankenphp-worker.php ]; then
            echo "[SIGAP] Menyiapkan public/frankenphp-worker.php..."
            cat << 'EOF' > /app/public/frankenphp-worker.php
<?php
$_SERVER['APP_BASE_PATH'] = $_ENV['APP_BASE_PATH'] ?? $_SERVER['APP_BASE_PATH'] ?? __DIR__.'/..';
$_SERVER['APP_PUBLIC_PATH'] = $_ENV['APP_PUBLIC_PATH'] ?? $_SERVER['APP_PUBLIC_PATH'] ?? __DIR__;
require __DIR__.'/../vendor/laravel/octane/bin/frankenphp-worker.php';
EOF
        fi

        # Pastikan APP_KEY valid (wajib dimulai dengan base64: dan panjang 44 char base64)
        CURRENT_KEY=$(grep -E '^APP_KEY=' /app/.env 2>/dev/null | cut -d '=' -f2- | tr -d ' "\r\n')
        case "$CURRENT_KEY" in
            base64:????????????????????????????????????????????)
                # Format key valid
                ;;
            *)
                echo "[SIGAP] APP_KEY tidak valid atau belum terisi. Membuat key baru..."
                NEW_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
                if [ -f /app/.env ]; then
                    if grep -q '^APP_KEY=' /app/.env; then
                        sed -i "s|^APP_KEY=.*|APP_KEY=${NEW_KEY}|g" /app/.env
                    else
                        echo "APP_KEY=${NEW_KEY}" >> /app/.env
                    fi
                fi
                CURRENT_KEY="$NEW_KEY"
                ;;
        esac
        export APP_KEY="$CURRENT_KEY"

        # Jalankan migrasi database otomatis jika diaktifkan (default true)
        if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
            echo "[SIGAP] Menjalankan migrasi database (php artisan migrate --force)..."
            php artisan migrate --force
        fi

        # Bersihkan cache lama
        php artisan optimize:clear
        ;;
esac

echo "[SIGAP] Memulai service: $@"
exec "$@"
