<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle mobile app authentication (Login via email or username).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        // Support 'login', 'email', or 'username' parameter
        $loginInput = $request->input('login') ?? $request->input('email') ?? $request->input('username');

        $request->merge(['login' => $loginInput]);

        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ], [
            'login.required' => 'Email atau username wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $loginValue = trim($validated['login']);
        $password = $validated['password'];
        $deviceName = trim($validated['device_name'] ?? 'Android Device');

        $throttleKey = Str::transliterate(Str::lower($loginValue) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return ResponseHelper::error("Terlalu banyak percobaan login gagal. Silakan coba lagi dalam {$seconds} detik.", 429);
        }

        // Determine if login is email or username
        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($field, $loginValue)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            return ResponseHelper::error('Email/username atau kata sandi yang Anda masukkan tidak cocok.', 401);
        }

        // Check if account is active
        if (! (bool) $user->is_active) {
            RateLimiter::hit($throttleKey, 60);

            return ResponseHelper::error('Akun Anda berstatus nonaktif. Silakan hubungi administrator sistem.', 403);
        }

        RateLimiter::clear($throttleKey);

        // Generate Sanctum Personal Access Token
        $token = $user->createToken($deviceName)->plainTextToken;

        // Log mobile login activity
        try {
            activity('auth')
                ->causedBy($user)
                ->withProperties([
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'device_name' => $deviceName,
                    'channel' => 'mobile_api',
                ])
                ->log("Pengguna \"{$user->name}\" berhasil login melalui aplikasi mobile ({$deviceName}).");
        } catch (\Throwable $e) {
            // Silently ignore activity log failure
        }

        return ResponseHelper::success('Login berhasil. Selamat datang kembali, ' . $user->name, [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    /**
     * Get the authenticated user's profile, roles, and permissions.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return ResponseHelper::success('Data profil pengguna berhasil dimuat.', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toISOString(),
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    /**
     * Log the user out (Revoke the current access token).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        try {
            activity('auth')
                ->causedBy($user)
                ->withProperties([
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'channel' => 'mobile_api',
                ])
                ->log("Pengguna \"{$user->name}\" keluar dari sesi aplikasi mobile.");
        } catch (\Throwable $e) {
            // Silently ignore activity log failure
        }

        return ResponseHelper::success('Logout berhasil. Sesi aplikasi mobile telah dicabut.');
    }
}
