<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        if (method_exists($user, 'load')) {
            $user->load('roles');
        }

        // Query log activity khusus untuk user yang sedang login
        $logQuery = \App\Models\Activity::with(['causer'])
            ->where(function ($q) use ($user) {
                $q->where('causer_id', $user->id)
                  ->orWhere(function ($sq) use ($user) {
                      $sq->where('subject_type', get_class($user))
                         ->where('subject_id', $user->id);
                  });
            })
            ->latest();

        if ($request->filled('log_search')) {
            $search = $request->input('log_search');
            $logQuery->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('log_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('log_event') && $request->input('log_event') !== 'all') {
            $logQuery->where('event', $request->input('log_event'));
        }

        if ($request->filled('log_module') && $request->input('log_module') !== 'all') {
            $logQuery->where('log_name', $request->input('log_module'));
        }

        $paginator = $logQuery->paginate(10)->withQueryString();
        $activityLogs = [
            'data' => $paginator->through(function ($log) {
                return [
                    'id' => $log->id,
                    'log_name' => $log->log_name ?? 'default',
                    'description' => $log->description,
                    'event' => $log->event,
                    'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                    'subject_id' => $log->subject_id,
                    'causer' => $log->causer ? [
                        'name' => $log->causer->name,
                        'username' => $log->causer->username,
                        'email' => $log->causer->email,
                    ] : null,
                    'attribute_changes' => $log->attribute_changes,
                    'properties' => $log->properties,
                    'created_at' => $log->created_at ? $log->created_at->format('d M Y, H:i:s') : '-',
                    'created_at_human' => $log->created_at ? $log->created_at->diffForHumans() : '-',
                ];
            })->items(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem() ?? 0,
                'last_page' => $paginator->lastPage(),
                'path' => $paginator->path(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem() ?? 0,
                'total' => $paginator->total(),
            ],
        ];

        // User activity stats
        $userBaseQuery = \App\Models\Activity::where(function ($q) use ($user) {
            $q->where('causer_id', $user->id)
              ->orWhere(function ($sq) use ($user) {
                  $sq->where('subject_type', get_class($user))
                     ->where('subject_id', $user->id);
              });
        });

        $activityStats = [
            'total' => (clone $userBaseQuery)->count(),
            'today' => (clone $userBaseQuery)->whereDate('created_at', today())->count(),
            'created' => (clone $userBaseQuery)->where('event', 'created')->count(),
            'updated' => (clone $userBaseQuery)->where('event', 'updated')->count(),
            'deleted' => (clone $userBaseQuery)->where('event', 'deleted')->count(),
        ];

        $availableModules = (clone $userBaseQuery)
            ->select('log_name')
            ->distinct()
            ->whereNotNull('log_name')
            ->pluck('log_name');

        // Ambil info sesi perangkat aktif
        $currentSessionId = $request->session()->getId();
        $userSessions = collect();

        if (Schema::hasTable('sessions')) {
            $userSessions = DB::table('sessions')
                ->where('user_id', $user->id)
                ->orderBy('last_activity', 'desc')
                ->take(5)
                ->get()
                ->map(function ($s) use ($currentSessionId) {
                    $agent = $s->user_agent ?? '';
                    $isCurrent = ($s->id === $currentSessionId);

                    // Parse OS
                    $os = 'Desktop Device';
                    $osIcon = 'bi-display';
                    if (stripos($agent, 'Windows') !== false) {
                        $os = 'Windows PC';
                        $osIcon = 'bi-windows';
                    } elseif (stripos($agent, 'Macintosh') !== false || stripos($agent, 'Mac OS') !== false) {
                        $os = 'macOS';
                        $osIcon = 'bi-apple';
                    } elseif (stripos($agent, 'Linux') !== false) {
                        $os = 'Linux';
                        $osIcon = 'bi-ubuntu';
                    } elseif (stripos($agent, 'Android') !== false) {
                        $os = 'Android Device';
                        $osIcon = 'bi-phone';
                    } elseif (stripos($agent, 'iPhone') !== false || stripos($agent, 'iPad') !== false) {
                        $os = 'iOS Device';
                        $osIcon = 'bi-phone';
                    }

                    // Parse Browser
                    $browser = 'Web Browser';
                    $browserIcon = 'bi-globe2';
                    if (stripos($agent, 'Edg') !== false) {
                        $browser = 'Microsoft Edge';
                        $browserIcon = 'bi-browser-edge';
                    } elseif (stripos($agent, 'Chrome') !== false) {
                        $browser = 'Google Chrome';
                        $browserIcon = 'bi-browser-chrome';
                    } elseif (stripos($agent, 'Firefox') !== false) {
                        $browser = 'Mozilla Firefox';
                        $browserIcon = 'bi-browser-firefox';
                    } elseif (stripos($agent, 'Safari') !== false) {
                        $browser = 'Apple Safari';
                        $browserIcon = 'bi-browser-safari';
                    }

                    $ip = ($s->ip_address === '::1' || $s->ip_address === '127.0.0.1') ? '127.0.0.1 (Localhost)' : ($s->ip_address ?? '127.0.0.1');

                    return [
                        'id' => $s->id,
                        'is_current' => $isCurrent,
                        'ip_address' => $ip,
                        'os' => $os,
                        'os_icon' => $osIcon,
                        'browser' => $browser,
                        'browser_icon' => $browserIcon,
                        'last_active' => $isCurrent ? 'Aktif Sekarang' : Carbon::createFromTimestamp($s->last_activity)->diffForHumans(),
                        'last_active_time' => Carbon::createFromTimestamp($s->last_activity)->format('d M Y, H:i'),
                    ];
                });
        }

        if ($userSessions->isEmpty()) {
            $agent = $request->userAgent() ?? '';
            $os = stripos($agent, 'Windows') !== false ? 'Windows PC' : (stripos($agent, 'Mac') !== false ? 'macOS' : 'Linux');
            $osIcon = stripos($agent, 'Windows') !== false ? 'bi-windows' : 'bi-display';
            $browser = stripos($agent, 'Firefox') !== false ? 'Mozilla Firefox' : (stripos($agent, 'Chrome') !== false ? 'Google Chrome' : 'Web Browser');
            $browserIcon = stripos($agent, 'Firefox') !== false ? 'bi-browser-firefox' : 'bi-browser-chrome';
            $ip = ($request->ip() === '::1' || $request->ip() === '127.0.0.1') ? '127.0.0.1 (Localhost)' : $request->ip();

            $userSessions = collect([[
                'id' => $currentSessionId,
                'is_current' => true,
                'ip_address' => $ip,
                'os' => $os,
                'os_icon' => $osIcon,
                'browser' => $browser,
                'browser_icon' => $browserIcon,
                'last_active' => 'Aktif Sekarang',
                'last_active_time' => now()->format('d M Y, H:i'),
            ]]);
        }

        $userSessions = $userSessions->sortByDesc('is_current')->values();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'userRoles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [],
            'activityLogs' => $activityLogs,
            'activityFilters' => [
                'log_search' => $request->input('log_search', ''),
                'log_event' => $request->input('log_event', 'all'),
                'log_module' => $request->input('log_module', 'all'),
            ],
            'activityStats' => $activityStats,
            'availableModules' => $availableModules,
            'userSessions' => $userSessions,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profil Anda berhasil diperbarui.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        activity('user')
            ->causedBy($user)
            ->performedOn($user)
            ->event('deleted')
            ->log("Akun pengguna \"{$user->name}\" ({$user->email}) telah dihapus");

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
