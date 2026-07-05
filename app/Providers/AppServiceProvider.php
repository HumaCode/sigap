<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use App\Repositories\Interfaces\SiteRepositoryInterface;
use App\Repositories\SiteRepository;
use App\Repositories\Interfaces\IncidentRepositoryInterface;
use App\Repositories\IncidentRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SiteRepositoryInterface::class, SiteRepository::class);
        $this->app->bind(IncidentRepositoryInterface::class, IncidentRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
