<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('email') && !$this->has('login')) {
            $this->merge(['login' => $this->input('email')]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'cf_turnstile_response' => ['nullable', 'string'],
            'cf-turnstile-response' => ['nullable', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();
        $this->verifyTurnstile();

        $login = $this->string('login')->toString();
        $password = $this->string('password')->toString();
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = \App\Models\User::where($field, $login)->first();

        // Cek jika kredensial user ditemukan dan password cocok
        if ($user && \Illuminate\Support\Facades\Hash::check($password, $user->password)) {
            // Cek jika user berstatus tidak aktif (is_active: 0)
            if (! (bool) $user->is_active) {
                RateLimiter::hit($this->throttleKey());

                throw ValidationException::withMessages([
                    'login' => 'Akun Anda dinonaktifkan (status tidak aktif). Silakan hubungi administrator.',
                ]);
            }

            Auth::login($user, $this->boolean('remember'));
            RateLimiter::clear($this->throttleKey());
            return;
        }

        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => 'Email/username atau kata sandi yang Anda masukkan tidak cocok.',
        ]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('login')).'|'.$this->ip());
    }

    /**
     * Verify Cloudflare Turnstile token if configured.
     *
     * @throws ValidationException
     */
    protected function verifyTurnstile(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $secretKey = \App\Models\Setting::getValue('turnstile_secret_key') ?: config('services.turnstile.secret_key');

        if (empty($secretKey)) {
            return;
        }

        $token = $this->input('cf_turnstile_response')
            ?: $this->input('cf-turnstile-response')
            ?: $this->input('turnstile');

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
                    'remoteip' => $this->ip(),
                ]);

            if (! $response->successful() || ! ($response->json('success') === true)) {
                $errorCodes = $response->json('error-codes') ?? [];
                Log::warning('Cloudflare Turnstile verification failed', [
                    'ip' => $this->ip(),
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
            Log::error('Cloudflare Turnstile connection error: ' . $e->getMessage());

            throw ValidationException::withMessages([
                'turnstile' => 'Gagal menghubungi server verifikasi Cloudflare Turnstile. Silakan coba sesaat lagi.',
            ]);
        }
    }
}

