FROM dunglas/frankenphp:php8.4

# Configure FrankenPHP Environment & Timezone
ENV SERVER_NAME=":8000" \
    OCTANE_SERVER="frankenphp" \
    TZ="Asia/Jakarta"

# Install System Dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libpq-dev \
        curl \
        tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions using the frankenphp base installer script
RUN install-php-extensions \
    pdo_mysql \
    pdo_pgsql \
    zip \
    pcntl \
    redis \
    gd \
    bcmath \
    intl \
    opcache \
    sockets

# Install Node.js (v22 LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application source code
COPY . .

# Copy entrypoint script and make it executable
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Install PHP and Node dependencies & build frontend assets
RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-scripts --ignore-platform-req=php+ \
    && npm install --no-audit \
    && npx vite build \
    && rm -rf /root/.npm /root/.composer

# Set proper permissions for Laravel directories
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache \
    && chmod -R 775 /app/storage /app/bootstrap/cache

# Use production entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command: Start Octane with FrankenPHP in production mode
CMD ["php", "artisan", "octane:start", "--server=frankenphp", "--host=0.0.0.0", "--port=8000", "--workers=auto"]
