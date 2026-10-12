<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class SsoAuthController extends Controller
{
    /**
     * Redirect the user to the HumaCode SSO authorization server.
     */
    public function redirect(Request $request): RedirectResponse
    {
        $enabled = (bool) Setting::getValue('sso_enabled', true);
        if (!$enabled) {
            return redirect()->route('login')->with('error', 'Layanan Single Sign-On (SSO) saat ini sedang dinonaktifkan.');
        }

        $baseUrl = rtrim(Setting::getValue('sso_base_url') ?: env('SSO_BASE_URL', 'http://localhost:8001'), '/');
        $clientId = Setting::getValue('sso_client_id') ?: env('SSO_CLIENT_ID', '');
        $redirectUri = Setting::getValue('sso_redirect_uri') ?: route('sso.callback');
        $scopes = Setting::getValue('sso_scopes');

        if (empty($scopes)) {
            $scopes = ['profile', 'roles'];
        } elseif (is_string($scopes)) {
            $scopes = json_decode($scopes, true) ?: explode(',', $scopes);
        }

        if (empty($clientId)) {
            return redirect()->route('login')->with(
                'error',
                'Konfigurasi SSO belum lengkap: Client ID belum diisi. Silakan atur pada menu Pengaturan > SSO HumaCode.'
            );
        }

        // Generate CSRF state protection
        $state = Str::random(40);
        $request->session()->put('sso_oauth_state', $state);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', array_filter((array) $scopes)),
            'state' => $state,
        ]);

        return redirect()->away("{$baseUrl}/oauth/authorize?{$query}");
    }

    /**
     * Handle the OAuth callback from HumaCode SSO server.
     */
    public function callback(Request $request): RedirectResponse
    {
        // 1. Check for error returned by SSO server
        if ($request->has('error')) {
            $errorDesc = $request->input('error_description') ?: $request->input('error');
            return redirect()->route('login')->with('error', "Otorisasi SSO dibatalkan: {$errorDesc}");
        }

        // 2. Validate state token to protect against CSRF
        $state = $request->input('state');
        $savedState = $request->session()->pull('sso_oauth_state');

        if (empty($state) || empty($savedState) || !hash_equals($savedState, $state)) {
            return redirect()->route('login')->with(
                'error',
                'Validasi sesi OAuth (state) tidak valid atau telah kedaluwarsa. Silakan ulangi proses login.'
            );
        }

        // 3. Ensure authorization code is present
        $code = $request->input('code');
        if (empty($code)) {
            return redirect()->route('login')->with('error', 'Authorization Code tidak diterima dari server SSO.');
        }

        // 4. Retrieve SSO credentials
        $baseUrl = rtrim(Setting::getValue('sso_base_url') ?: env('SSO_BASE_URL', 'http://localhost:8001'), '/');
        $clientId = Setting::getValue('sso_client_id') ?: env('SSO_CLIENT_ID', '');
        $clientSecret = Setting::getValue('sso_client_secret') ?: env('SSO_CLIENT_SECRET', '');
        $redirectUri = Setting::getValue('sso_redirect_uri') ?: route('sso.callback');

        // 5. Exchange code for Access Token
        try {
            $tokenResponse = Http::withoutVerifying()
                ->asForm()
                ->timeout(15)
                ->post("{$baseUrl}/oauth/token", [
                    'grant_type' => 'authorization_code',
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => $redirectUri,
                    'code' => $code,
                ]);
        } catch (\Exception $e) {
            Log::error('SSO token exchange failed: ' . $e->getMessage());
            return redirect()->route('login')->with(
                'error',
                'Gagal menghubungi server SSO saat menukarkan token otentikasi: ' . $e->getMessage()
            );
        }

        if ($tokenResponse->failed()) {
            Log::error('SSO token response error: ' . $tokenResponse->body());
            $errorMsg = $tokenResponse->json('message')
                ?: $tokenResponse->json('error_description')
                ?: 'Gagal memperoleh access token dari server SSO.';
            return redirect()->route('login')->with('error', "Autentikasi SSO Gagal: {$errorMsg}");
        }

        $accessToken = $tokenResponse->json('access_token');
        if (empty($accessToken)) {
            return redirect()->route('login')->with('error', 'Access Token tidak ditemukan dalam respons server SSO.');
        }

        // 6. Fetch user profile from /api/userinfo
        try {
            $userInfoResponse = Http::withoutVerifying()
                ->withToken($accessToken)
                ->timeout(15)
                ->get("{$baseUrl}/api/userinfo");
        } catch (\Exception $e) {
            Log::error('SSO userinfo request error: ' . $e->getMessage());
            return redirect()->route('login')->with(
                'error',
                'Gagal mengambil informasi profil pengguna dari server SSO: ' . $e->getMessage()
            );
        }

        if ($userInfoResponse->failed()) {
            Log::error('SSO userinfo failed: ' . $userInfoResponse->body());
            return redirect()->route('login')->with(
                'error',
                'Server SSO menolak permintaan informasi pengguna (HTTP ' . $userInfoResponse->status() . ').'
            );
        }

        $ssoUser = $userInfoResponse->json();
        $email = $ssoUser['email'] ?? null;

        if (empty($email)) {
            return redirect()->route('login')->with('error', 'Data email tidak ditemukan pada profil pengguna SSO.');
        }

        $name = $ssoUser['name'] ?? explode('@', $email)[0];
        $roles = (array) ($ssoUser['roles'] ?? []);

        // 7. Find existing user or register new user in SIGAP
        $user = User::where('email', $email)->first();

        if ($user) {
            // Check active status
            if (!(bool) $user->is_active) {
                return redirect()->route('login')->with(
                    'error',
                    'Akun Anda dinonaktifkan (status tidak aktif). Silakan hubungi administrator.'
                );
            }

            // Sync user name if updated
            if (!empty($name) && $user->name !== $name) {
                $user->name = $name;
                $user->save();
            }
        } else {
            // Register new user from SSO
            $baseUsername = Str::slug(explode('@', $email)[0], '_') ?: 'user_sso';
            $username = $baseUsername;
            $counter = 1;

            while (User::where('username', $username)->exists()) {
                $username = "{$baseUsername}_{$counter}";
                $counter++;
            }

            $user = User::create([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'is_active' => true,
                'email_verified_at' => !empty($ssoUser['email_verified']) ? now() : now(),
            ]);
        }

        // 8. Map and synchronize roles
        if (!empty($roles)) {
            $targetRole = 'user';
            if (in_array('dev', $roles) || in_array('developer', $roles)) {
                $targetRole = 'dev';
            } elseif (in_array('admin', $roles) || in_array('administrator', $roles)) {
                $targetRole = 'admin';
            }

            if (Role::where('name', $targetRole)->exists()) {
                // If user doesn't have roles yet, or incoming SSO role is dev
                if (!$user->roles()->exists() || $targetRole === 'dev') {
                    $user->syncRoles([$targetRole]);
                }
            }
        } elseif (!$user->roles()->exists()) {
            if (Role::where('name', 'user')->exists()) {
                $user->assignRole('user');
            }
        }

        // 9. Log in user into session
        Auth::login($user, true);
        $request->session()->regenerate();

        // 10. Audit log activity
        try {
            activity('auth')
                ->causedBy($user)
                ->withProperties([
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'provider' => 'sso_humacode',
                    'sso_id' => $ssoUser['id'] ?? null,
                ])
                ->log("Pengguna \"{$user->name}\" berhasil login melalui SSO HumaCode.");
        } catch (\Throwable $e) {
            // Prevent audit log from breaking the login flow
        }

        return redirect()->intended(route('dashboard'))->with(
            'success',
            "Selamat datang kembali, {$user->name}! Anda berhasil login melalui SSO HumaCode."
        );
    }

    /**
     * Handle Single Logout (SLO) callback.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Anda telah keluar dari sesi.');
    }
}
