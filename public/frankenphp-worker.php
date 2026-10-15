<?php

set_exception_handler(function ($e) {
    fwrite(STDERR, "\n================ [FRANKENPHP WORKER BOOT ERROR] ================\n");
    fwrite(STDERR, (string) $e . "\n");
    fwrite(STDERR, "=================================================================\n\n");
    exit(1);
});

// Set a default for the application base path and public path if they are missing...
$_SERVER['APP_BASE_PATH'] = $_ENV['APP_BASE_PATH'] ?? $_SERVER['APP_BASE_PATH'] ?? __DIR__.'/..';
$_SERVER['APP_PUBLIC_PATH'] = $_ENV['APP_PUBLIC_PATH'] ?? $_SERVER['APP_PUBLIC_PATH'] ?? __DIR__;

require __DIR__.'/../vendor/laravel/octane/bin/frankenphp-worker.php';
