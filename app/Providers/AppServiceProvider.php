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
use App\Models\Keyword;
use App\Models\SiteSecurity;
use App\Models\Incident;
use App\Models\User;
use App\Policies\SitePolicy;
use App\Policies\UptimeReportPolicy;
use App\Policies\DetectionLogPolicy;
use App\Policies\KeywordPolicy;
use App\Policies\SiteSecurityPolicy;
use App\Policies\IncidentPolicy;
use App\Policies\UserPolicy;
use App\Observers\DetectionLogObserver;
use Illuminate\Support\Facades\Gate;

use App\Services\Interfaces\UptimeReportServiceInterface;
use App\Services\UptimeReportService;
use App\Services\Interfaces\DetectionLogServiceInterface;
use App\Services\DetectionLogService;
use App\Services\Interfaces\KeywordServiceInterface;
use App\Services\KeywordService;
use App\Services\Interfaces\SiteSecurityServiceInterface;
use App\Services\SiteSecurityService;
use App\Services\Interfaces\IncidentServiceInterface;
use App\Services\IncidentService;
use App\Services\Interfaces\UserServiceInterface;
use App\Services\UserService;

use Illuminate\Notifications\DatabaseNotification;
use App\Policies\NotificationPolicy;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use App\Repositories\NotificationRepository;
use App\Services\Interfaces\NotificationServiceInterface;
use App\Services\NotificationService;
use App\Repositories\Interfaces\SettingRepositoryInterface;
use App\Repositories\SettingRepository;
use App\Services\Interfaces\SettingServiceInterface;
use App\Services\SettingService;

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
        $this->app->bind(DetectionLogServiceInterface::class, DetectionLogService::class);
        $this->app->bind(UptimeReportServiceInterface::class, UptimeReportService::class);
        $this->app->bind(KeywordServiceInterface::class, KeywordService::class);
        $this->app->bind(SiteSecurityServiceInterface::class, SiteSecurityService::class);
        $this->app->bind(IncidentServiceInterface::class, IncidentService::class);
        $this->app->bind(UserServiceInterface::class, UserService::class);
        $this->app->bind(NotificationRepositoryInterface::class, NotificationRepository::class);
        $this->app->bind(NotificationServiceInterface::class, NotificationService::class);
        $this->app->bind(SettingRepositoryInterface::class, SettingRepository::class);
        $this->app->bind(SettingServiceInterface::class, SettingService::class);
        $this->app->bind(
            \App\Services\Interfaces\ServerInvestigationServiceInterface::class,
            \App\Services\ServerInvestigationService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        DetectionLog::observe(DetectionLogObserver::class);
        Gate::policy(Site::class, SitePolicy::class);
        Gate::policy(DetectionLog::class, DetectionLogPolicy::class);
        Gate::policy(Keyword::class, KeywordPolicy::class);
        Gate::policy(SiteSecurity::class, SiteSecurityPolicy::class);
        Gate::policy(Incident::class, IncidentPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(DatabaseNotification::class, NotificationPolicy::class);

        // Incident Authorization Gates
        Gate::define('view-incidents', [IncidentPolicy::class, 'viewAny']);
        Gate::define('resolve-all-incidents', [IncidentPolicy::class, 'resolveAll']);

        // Uptime Report Authorization Gates
        Gate::define('view-uptime-reports', [UptimeReportPolicy::class, 'viewAny']);
        Gate::define('export-uptime-reports', [UptimeReportPolicy::class, 'export']);
        Gate::define('view-uptime-audit-detail', [UptimeReportPolicy::class, 'viewAuditDetail']);

        // Detection Logs Authorization Gates
        Gate::define('view-detection-logs', [DetectionLogPolicy::class, 'viewAny']);
        Gate::define('manage-detection-status', [DetectionLogPolicy::class, 'updateStatus']);
        Gate::define('mark-all-detection-logs', [DetectionLogPolicy::class, 'markAllReviewed']);

        // Keyword Dictionary Authorization Gates
        Gate::define('view-keywords', [KeywordPolicy::class, 'viewAny']);
        Gate::define('create-keywords', [KeywordPolicy::class, 'create']);
        Gate::define('edit-keywords', [KeywordPolicy::class, 'update']);
        Gate::define('delete-keywords', [KeywordPolicy::class, 'delete']);

        // Site Security Authorization Gates
        Gate::define('view-site-security', [SiteSecurityPolicy::class, 'viewAny']);
        Gate::define('scan-site-security', [SiteSecurityPolicy::class, 'scan']);

        // User Management Authorization Gates
        Gate::define('view-users', [UserPolicy::class, 'viewAny']);
        Gate::define('manage-users', [UserPolicy::class, 'create']);

        // Notification Authorization Gates
        Gate::define('view-notifications', [NotificationPolicy::class, 'viewAny']);
    }
}
