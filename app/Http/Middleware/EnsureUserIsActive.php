<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Jika belum login, tendang ke halaman login
        if (! Auth::check()) {
            return redirect()->guest(route('login'));
        }

        $user = $request->user();

        // 2. Jika sudah login tetapi status is_active nya 0 / false, logout dan tendang ke login dengan pesan error
        if (! $user || ! (bool) $user->is_active) {
            Auth::logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return redirect()->route('login')
                ->withErrors([
                    'login' => 'Akun Anda dinonaktifkan (status tidak aktif). Silakan hubungi administrator.',
                ])
                ->with('error', 'Akun Anda dinonaktifkan (status tidak aktif). Silakan hubungi administrator.');
        }

        return $next($request);
    }
}
