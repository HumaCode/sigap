<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'unread_notifications_count' => fn () => $request->user() ? $request->user()->unreadNotifications()->count() : 0,
            'menus' => $request->user() ? menus(true) : [],
            'app_name' => Setting::getValue('app_name') ?: config('app.name', 'SIGAP'),
            'sso_enabled' => (bool) Setting::getValue('sso_enabled', true),
            'seo' => [
                'meta_title' => Setting::getValue('seo_meta_title', config('app.name', 'SIGAP Web')),
                'meta_description' => Setting::getValue('seo_meta_description', ''),
            ],
            'telemetry' => fn () => Cache::remember('auth_telemetry_stats', 60, function () {
                try {
                    $totalSites = Site::count();
                    $activeSites = Site::where('is_active', true)->count();
                    $warnSites = Site::where('status', 'warn')->count();
                    $upSites = Site::where('status', 'up')->count();

                    $avgUptime = 0.0;
                    if ($totalSites > 0) {
                        $computed = (($upSites * 100) + ($warnSites * 95)) / $totalSites;
                        $avgUptime = round($computed, 1);
                    }

                    return [
                        'total_sites' => $totalSites,
                        'active_sites' => $activeSites,
                        'avg_uptime' => $totalSites > 0 ? ($avgUptime . '%') : '0%',
                        'ai_sentinel' => '24/7',
                    ];
                } catch (\Throwable $e) {
                    return [
                        'total_sites' => 0,
                        'active_sites' => 0,
                        'avg_uptime' => '0%',
                        'ai_sentinel' => '24/7',
                    ];
                }
            }),
        ];
    }
}
