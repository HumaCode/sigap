<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'ssoEnabled' => (bool) \App\Models\Setting::getValue('sso_enabled', true),
            'turnstileSiteKey' => (string) (\App\Models\Setting::getValue('turnstile_site_key') ?: config('services.turnstile.site_key', '')),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): mixed
    {
        $user = $request->user();
        if ($user) {
            try {
                activity('auth')
                    ->causedBy($user)
                    ->withProperties([
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ])
                    ->log("Pengguna \"{$user->name}\" keluar dari sesi (logout).");
            } catch (\Throwable $e) {
                // Ignore audit log failure during logout
            }
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $ssoEnabled = (bool) \App\Models\Setting::getValue('sso_enabled', false);
        $ssoBaseUrl = \App\Models\Setting::getValue('sso_base_url') ?: env('SSO_BASE_URL', 'http://localhost:8001');

        if ($ssoEnabled && !empty($ssoBaseUrl)) {
            $normalizedBase = rtrim($ssoBaseUrl, '/');
            $redirectUri = url('/login');
            $ssoLogoutUrl = "{$normalizedBase}/sso/logout?" . http_build_query([
                'redirect_uri' => $redirectUri,
            ]);

            return Inertia::location($ssoLogoutUrl);
        }

        return redirect()->route('login')->with('status', 'Anda telah berhasil keluar dari sistem.');
    }
}
