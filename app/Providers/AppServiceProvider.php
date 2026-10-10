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
use App\Repositories\Interfaces\SiteSecurityRepositoryInterface;
use App\Repositories\SiteSecurityRepository;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Repositories\UserRepository;

use App\Models\DetectionLog;
use App\Models\Site;
use App\Policies\SitePolicy;
use App\Policies\UptimeReportPolicy;
use App\Observers\DetectionLogObserver;
use Illuminate\Support\Facades\Gate;

use App\Services\Interfaces\UptimeReportServiceInterface;
use App\Services\UptimeReportService;

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
        $this->app->bind(SiteSecurityRepositoryInterface::class, SiteSecurityRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(UptimeReportServiceInterface::class, UptimeReportService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        DetectionLog::observe(DetectionLogObserver::class);
        Gate::policy(Site::class, SitePolicy::class);

        // Uptime Report Authorization Gates
        Gate::define('view-uptime-reports', [UptimeReportPolicy::class, 'viewAny']);
        Gate::define('export-uptime-reports', [UptimeReportPolicy::class, 'export']);
        Gate::define('view-uptime-audit-detail', [UptimeReportPolicy::class, 'viewAuditDetail']);
    }
}
