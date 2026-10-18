<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'turnstileSiteKey' => (string) (\App\Models\Setting::getValue('turnstile_site_key') ?: config('services.turnstile.site_key', '')),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $this->verifyTurnstile($request);

        $request->validate([
            'email' => 'required|email',
        ]);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    /**
     * Verify Cloudflare Turnstile token if configured.
     *
     * @throws ValidationException
     */
    protected function verifyTurnstile(Request $request): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $secretKey = \App\Models\Setting::getValue('turnstile_secret_key') ?: config('services.turnstile.secret_key');

        if (empty($secretKey)) {
            return;
        }

        $token = $request->input('cf_turnstile_response')
            ?: $request->input('cf-turnstile-response')
            ?: $request->input('turnstile');

        if (empty($token)) {
            throw ValidationException::withMessages([
                'turnstile' => 'Harap selesaikan verifikasi Cloudflare Turnstile terlebih dahulu.',
            ]);
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secretKey,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);

            if (! $response->successful() || ! ($response->json('success') === true)) {
                $errorCodes = $response->json('error-codes') ?? [];
                Log::warning('Cloudflare Turnstile verification failed on forgot-password', [
                    'ip' => $request->ip(),
                    'error_codes' => $errorCodes,
                    'response_body' => $response->json(),
                ]);

                throw ValidationException::withMessages([
                    'turnstile' => 'Verifikasi keamanan Cloudflare Turnstile tidak valid atau telah kedaluwarsa. Silakan centang kembali.',
                ]);
            }
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Cloudflare Turnstile connection error on forgot-password: ' . $e->getMessage());

            throw ValidationException::withMessages([
                'turnstile' => 'Gagal menghubungi server verifikasi Cloudflare Turnstile. Silakan coba sesaat lagi.',
            ]);
        }
    }
}

