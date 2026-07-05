<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use App\Repositories\Interfaces\SiteRepositoryInterface;
use App\Repositories\SiteRepository;
use App\Repositories\Interfaces\IncidentRepositoryInterface;
use App\Repositories\IncidentRepository;
use App\Repositories\Interfaces\UptimeReportRepositoryInterface;
use App\Repositories\UptimeReportRepository;
use App\Repositories\Interfaces\DetectionLogRepositoryInterface;
use App\Repositories\DetectionLogRepository;
use App\Repositories\Interfaces\KeywordRepositoryInterface;
use App\Repositories\KeywordRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SiteRepositoryInterface::class, SiteRepository::class);
        $this->app->bind(IncidentRepositoryInterface::class, IncidentRepository::class);
        $this->app->bind(UptimeReportRepositoryInterface::class, UptimeReportRepository::class);
        $this->app->bind(DetectionLogRepositoryInterface::class, DetectionLogRepository::class);
        $this->app->bind(KeywordRepositoryInterface::class, KeywordRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
