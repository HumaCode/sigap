FROM dunglas/frankenphp:php8.3

# Configure FrankenPHP Environment
ENV SERVER_NAME=":8000" \
    OCTANE_SERVER="frankenphp"

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
    opcache

# Install Node.js (needed for Vite and Octane file watching in dev)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application files (Can be overridden by docker-compose volume for local dev)
COPY . .

# Set proper permissions for Laravel
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Default command
CMD ["php", "artisan", "octane:start", "--server=frankenphp", "--host=0.0.0.0", "--port=8000"]
