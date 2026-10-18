<?php

namespace App\Services;

use App\Models\Setting;
use App\Repositories\Interfaces\SettingRepositoryInterface;
use App\Services\Interfaces\SettingServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SettingService implements SettingServiceInterface
{
    public function __construct(
        protected SettingRepositoryInterface $settingRepository
    ) {}

    public function getSettingsData(): array
    {
        // 1. 9Router Settings
        $nineRouterEndpoint = Setting::getValue('ninerouter_endpoint') ?: env('NINEROUTER_API_ENDPOINT', 'https://9router.humacode.my.id/v1');
        $nineRouterApiKey = Setting::getValue('ninerouter_api_key') ?: env('NINEROUTER_API_KEY', '');
        $nineRouterModel = Setting::getValue('ninerouter_model') ?: env('NINEROUTER_MODEL', 'combo-maut');
        $nineRouterAvailableModels = Setting::getValue('ninerouter_available_models') ?: [];

        // 2. SEO Settings
        $seoMetaTitle = Setting::getValue('seo_meta_title') ?: 'SIGAP Web - Sistem Informasi Gawat & Antisipasi Pengamanan Website';
        $seoMetaDescription = Setting::getValue('seo_meta_description') ?: 'Platform monitoring keamanan, defacement detection, uptime ketersediaan, dan postur keamanan aset digital pemerintah secara real-time.';
        $seoMetaKeywords = Setting::getValue('seo_meta_keywords') ?: 'monitoring website, deface detection, cyber security, government web, sigap, uptime monitoring';
        $seoAuthor = Setting::getValue('seo_author') ?: '';
        $seoRobotsIndex = Setting::getValue('seo_robots_index', true);
        $seoGoogleVerification = Setting::getValue('seo_google_verification') ?: '';

        // 3. Activity Log Settings
        $logRetentionDays = (int) (Setting::getValue('log_retention_days') ?: 30);
        $logLevel = Setting::getValue('log_level') ?: 'info';
        $logAutoPrune = (bool) Setting::getValue('log_auto_prune', true);
        $logAutoBackup = (bool) Setting::getValue('log_auto_backup_enabled', true);

        // 4. General Settings
        $appName = Setting::getValue('app_name') ?: config('app.name', 'SIGAP Web');
        $picEmail = Setting::getValue('pic_contact_email') ?: '';
        $picWa = Setting::getValue('pic_contact_wa') ?: '';
        $telegramBotToken = Setting::getValue('telegram_bot_token') ?: env('TELEGRAM_BOT_TOKEN', '');
        $telegramChatId = Setting::getValue('telegram_chat_id') ?: env('TELEGRAM_CHAT_ID', '');

        // 5. SSO Settings
        $ssoEnabled = (bool) Setting::getValue('sso_enabled', true);
        $ssoAppName = Setting::getValue('sso_app_name') ?: 'SIGAP Web';
        $ssoBaseUrl = Setting::getValue('sso_base_url') ?: env('SSO_BASE_URL', 'http://localhost:8001');
        $ssoClientId = Setting::getValue('sso_client_id') ?: env('SSO_CLIENT_ID', '');
        $ssoClientSecret = Setting::getValue('sso_client_secret') ?: env('SSO_CLIENT_SECRET', '');
        $defaultCallback = (request() && request()->hasHeader('host'))
            ? url('/auth/callback')
            : (config('app.url') ? rtrim(config('app.url'), '/') . '/auth/callback' : 'http://localhost:8000/auth/callback');
        $defaultLogout = (request() && request()->hasHeader('host'))
            ? url('/auth/logout')
            : (config('app.url') ? rtrim(config('app.url'), '/') . '/auth/logout' : 'http://localhost:8000/auth/logout');
        $ssoRedirectUri = Setting::getValue('sso_redirect_uri') ?: $defaultCallback;
        $ssoLogoutUri = Setting::getValue('sso_logout_uri') ?: $defaultLogout;
        $ssoScopes = Setting::getValue('sso_scopes');
        if (empty($ssoScopes)) {
            $ssoScopes = ['profile', 'roles'];
        } elseif (is_string($ssoScopes)) {
            $ssoScopes = json_decode($ssoScopes, true) ?: explode(',', $ssoScopes);
        }
        $ssoFirstParty = (bool) Setting::getValue('sso_first_party', true);

        return [
            'ninerouter' => [
                'endpoint' => $nineRouterEndpoint,
                'api_key' => $nineRouterApiKey,
                'model' => $nineRouterModel,
                'available_models' => $nineRouterAvailableModels,
                'has_api_key' => !empty($nineRouterApiKey),
            ],
            'sso' => [
                'enabled' => $ssoEnabled,
                'app_name' => $ssoAppName,
                'base_url' => $ssoBaseUrl,
                'client_id' => $ssoClientId,
                'client_secret' => $ssoClientSecret,
                'has_client_secret' => !empty($ssoClientSecret),
                'redirect_uri' => $ssoRedirectUri,
                'logout_uri' => $ssoLogoutUri,
                'scopes' => array_values((array) $ssoScopes),
                'first_party' => $ssoFirstParty,
            ],
            'seo' => [
                'meta_title' => $seoMetaTitle,
                'meta_description' => $seoMetaDescription,
                'meta_keywords' => $seoMetaKeywords,
                'author' => $seoAuthor,
                'robots_index' => (bool) $seoRobotsIndex,
                'google_verification' => $seoGoogleVerification,
                'app_url' => config('app.url') ?: env('APP_URL', 'http://localhost:8000'),
            ],
            'activity_log' => [
                'retention_days' => $logRetentionDays,
                'log_level' => $logLevel,
                'auto_prune' => $logAutoPrune,
                'auto_backup_enabled' => $logAutoBackup,
            ],
            'general' => [
                'app_name' => $appName,
                'pic_contact_email' => $picEmail,
                'pic_contact_wa' => $picWa,
                'telegram_bot_token' => $telegramBotToken,
                'telegram_chat_id' => $telegramChatId,
                'has_telegram_token' => !empty($telegramBotToken),
            ],
        ];
    }

    public function saveSettings(string $group, array $data): void
    {
        switch ($group) {
            case 'ninerouter':
                if (isset($data['endpoint'])) {
                    Setting::setValue('ninerouter_endpoint', trim($data['endpoint']), 'ninerouter', false);
                }
                // Only overwrite API Key if provided (not empty)
                if (!empty($data['api_key'])) {
                    Setting::setValue('ninerouter_api_key', trim($data['api_key']), 'ninerouter', true);
                }
                if (isset($data['model'])) {
                    Setting::setValue('ninerouter_model', trim($data['model']), 'ninerouter', false);
                }
                if (isset($data['available_models']) && is_array($data['available_models'])) {
                    Setting::setValue('ninerouter_available_models', $data['available_models'], 'ninerouter', false);
                }
                break;

            case 'sso':
                Setting::setValue('sso_enabled', !empty($data['sso_enabled']), 'sso', false);
                Setting::setValue('sso_app_name', $data['sso_app_name'] ?? 'SIGAP Web', 'sso', false);
                Setting::setValue('sso_base_url', rtrim(trim($data['sso_base_url'] ?? 'http://localhost:8001'), '/'), 'sso', false);
                Setting::setValue('sso_redirect_uri', trim($data['sso_redirect_uri'] ?? ''), 'sso', false);
                Setting::setValue('sso_logout_uri', trim($data['sso_logout_uri'] ?? ''), 'sso', false);
                
                $scopes = $data['sso_scopes'] ?? ['profile', 'roles'];
                if (is_string($scopes)) {
                    $scopes = explode(',', $scopes);
                }
                Setting::setValue('sso_scopes', array_values((array) $scopes), 'sso', false);
                Setting::setValue('sso_first_party', !empty($data['sso_first_party']), 'sso', false);

                if (isset($data['sso_client_id'])) {
                    Setting::setValue('sso_client_id', trim($data['sso_client_id']), 'sso', false);
                }
                if (!empty($data['sso_client_secret'])) {
                    Setting::setValue('sso_client_secret', trim($data['sso_client_secret']), 'sso', true);
                }
                break;

            case 'seo':
                Setting::setValue('seo_meta_title', $data['meta_title'] ?? '', 'seo', false);
                Setting::setValue('seo_meta_description', $data['meta_description'] ?? '', 'seo', false);
                Setting::setValue('seo_meta_keywords', $data['meta_keywords'] ?? '', 'seo', false);
                Setting::setValue('seo_author', $data['author'] ?? '', 'seo', false);
                Setting::setValue('seo_robots_index', !empty($data['robots_index']), 'seo', false);
                Setting::setValue('seo_google_verification', $data['google_verification'] ?? '', 'seo', false);
                break;

            case 'activity_log':
                Setting::setValue('log_retention_days', (int) ($data['retention_days'] ?? 30), 'activity_log', false);
                Setting::setValue('log_level', $data['log_level'] ?? 'info', 'activity_log', false);
                Setting::setValue('log_auto_prune', !empty($data['auto_prune']), 'activity_log', false);
                if (isset($data['auto_backup_enabled'])) {
                    Setting::setValue('log_auto_backup_enabled', !empty($data['auto_backup_enabled']), 'activity_log', false);
                }
                break;

            case 'general':
                Setting::setValue('app_name', $data['app_name'] ?? 'SIGAP Web', 'general', false);
                Setting::setValue('pic_contact_email', $data['pic_contact_email'] ?? '', 'general', false);
                Setting::setValue('pic_contact_wa', $data['pic_contact_wa'] ?? '', 'general', false);
                if (!empty($data['telegram_bot_token'])) {
                    Setting::setValue('telegram_bot_token', trim($data['telegram_bot_token']), 'general', true);
                }
                if (isset($data['telegram_chat_id'])) {
                    Setting::setValue('telegram_chat_id', trim($data['telegram_chat_id']), 'general', false);
                }
                break;
        }
    }

    public function testNineRouter(string $endpoint, string $apiKey): array
    {
        $normalizedEndpoint = rtrim(trim($endpoint), '/');

        // Target models URL
        $modelsUrl = Str::endsWith($normalizedEndpoint, '/v1') 
            ? "{$normalizedEndpoint}/models" 
            : "{$normalizedEndpoint}/v1/models";

        try {
            $response = Http::withToken($apiKey)
                ->timeout(12)
                ->withoutVerifying()
                ->get($modelsUrl);

            if ($response->successful()) {
                $payload = $response->json();
                $rawModels = $payload['data'] ?? [];

                $formattedModels = [];
                foreach ($rawModels as $model) {
                    $id = $model['id'] ?? null;
                    if (!$id) continue;

                    $ownedBy = $model['owned_by'] ?? '9router';
                    $contextLength = $model['context_length'] ?? ($model['capabilities']['contextWindow'] ?? null);
                    $hasVision = !empty($model['capabilities']['vision']);
                    $hasReasoning = !empty($model['capabilities']['reasoning']);

                    $formattedModels[] = [
                        'id' => $id,
                        'name' => $id,
                        'owned_by' => $ownedBy,
                        'context_length' => $contextLength,
                        'has_vision' => $hasVision,
                        'has_reasoning' => $hasReasoning,
                    ];
                }

                // Auto-save the endpoint, API key, and fetched available models into settings
                Setting::setValue('ninerouter_endpoint', $normalizedEndpoint, 'ninerouter', false);
                Setting::setValue('ninerouter_api_key', trim($apiKey), 'ninerouter', true);
                Setting::setValue('ninerouter_available_models', $formattedModels, 'ninerouter', false);

                $currentModel = Setting::getValue('ninerouter_model');
                if (empty($currentModel) && !empty($formattedModels[0]['id'])) {
                    Setting::setValue('ninerouter_model', $formattedModels[0]['id'], 'ninerouter', false);
                }

                return [
                    'success' => true,
                    'message' => 'Koneksi ke 9Router API berhasil dan pengaturan otomatis disinkronkan! Berhasil memuat ' . count($formattedModels) . ' model.',
                    'count' => count($formattedModels),
                    'models' => $formattedModels,
                ];
            }

            if ($response->status() === 401) {
                return [
                    'success' => false,
                    'message' => 'Autentikasi Gagal (401): API Key 9Router tidak valid atau kedaluwarsa.',
                    'models' => [],
                ];
            }

            if ($response->status() === 404) {
                return [
                    'success' => false,
                    'message' => 'Endpoint tidak ditemukan (404): Periksa kembali URL endpoint 9Router Anda.',
                    'models' => [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Gagal terhubung ke 9Router API (Status ' . $response->status() . '): ' . Str::limit($response->body(), 150),
                'models' => [],
            ];
        } catch (\Exception $e) {
            Log::error('NineRouter connection test failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Gagal menghubungi server 9Router: ' . $e->getMessage(),
                'models' => [],
            ];
        }
    }

    public function testSsoConnection(string $baseUrl): array
    {
        $normalizedUrl = rtrim(trim($baseUrl), '/');

        try {
            $response = Http::withoutVerifying()
                ->timeout(8)
                ->get($normalizedUrl);

            // Any standard HTTP response indicates the SSO host is reachable and active
            if ($response->successful() || in_array($response->status(), [200, 301, 302, 400, 401, 403, 404, 405])) {
                return [
                    'success' => true,
                    'message' => "Koneksi ke Server SSO HumaCode berhasil! Server merespons aktif pada {$normalizedUrl} (HTTP {$response->status()}).",
                    'status' => $response->status(),
                ];
            }

            return [
                'success' => false,
                'message' => "Server SSO merespons dengan status HTTP {$response->status()}.",
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('SSO connection test failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Gagal menghubungi server SSO HumaCode: ' . $e->getMessage(),
            ];
        }
    }

    public function testTelegramConnection(?string $botToken = null, ?string $chatId = null): array
    {
        $token = trim((string) ($botToken ?: (Setting::getValue('telegram_bot_token') ?: env('TELEGRAM_BOT_TOKEN', ''))));
        $chat = trim((string) ($chatId ?: (Setting::getValue('telegram_chat_id') ?: env('TELEGRAM_CHAT_ID', ''))));

        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Telegram Bot Token belum diisi atau belum tersimpan.',
            ];
        }

        if (empty($chat)) {
            return [
                'success' => false,
                'message' => 'Telegram Chat ID / Group ID belum diisi.',
            ];
        }

        try {
            // 1. Validasi bot token via endpoint getMe Telegram
            $meResponse = Http::timeout(8)->get("https://api.telegram.org/bot{$token}/getMe");

            if ($meResponse->status() === 401) {
                return [
                    'success' => false,
                    'message' => 'Autentikasi Gagal (401): Telegram Bot Token tidak valid.',
                ];
            }

            if (!$meResponse->successful()) {
                $desc = $meResponse->json('description') ?: 'Status ' . $meResponse->status();
                return [
                    'success' => false,
                    'message' => 'Gagal memverifikasi Bot Telegram: ' . $desc,
                ];
            }

            $botInfo = $meResponse->json('result', []);
            $botUsername = $botInfo['username'] ?? 'Bot';
            $botFirstName = $botInfo['first_name'] ?? 'Bot';

            // 2. Kirim pesan pengujian interaktif ke chat_id
            $nowFormatted = now()->timezone('Asia/Jakarta')->format('d M Y, H:i:s') . ' WIB';
            $appName = Setting::getValue('app_name', config('app.name', 'SIGAP Web'));

            $messageText = "🛡️ *UJI KONEKSI TELEGRAM {$appName}*\n\n"
                . "✅ *Status:* Terhubung & Aktif\n"
                . "🤖 *Bot:* @{$botUsername} ({$botFirstName})\n"
                . "🆔 *Chat ID:* `{$chat}`\n"
                . "📅 *Waktu:* {$nowFormatted}\n\n"
                . "_Pesan ini mengonfirmasi bahwa bot berhasil terhubung dan siap mengirimkan notifikasi insiden serta ketersediaan sistem._";

            $sendResponse = Http::timeout(8)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chat,
                'text' => $messageText,
                'parse_mode' => 'Markdown',
            ]);

            if ($sendResponse->successful()) {
                return [
                    'success' => true,
                    'message' => "Koneksi Telegram berhasil! Pesan uji coba berhasil dikirim oleh @{$botUsername} ke Chat ID {$chat}.",
                    'bot' => [
                        'username' => $botUsername,
                        'name' => $botFirstName,
                    ],
                ];
            }

            $desc = $sendResponse->json('description') ?: 'Gagal mengirim pesan ke chat ID tersebut.';

            // Feedback spesifik untuk error umum Telegram Bot
            if (str_contains(strtolower($desc), 'chat not found')) {
                $desc .= ' (Pastikan bot sudah di-invite ke grup/channel atau akun penerima sudah pernah klik /start pada bot).';
            } elseif (str_contains(strtolower($desc), 'bot was blocked')) {
                $desc .= ' (Bot diblokir oleh user tujuan. Silakan buka chat bot dan klik Unblock/Restart).';
            } elseif (str_contains(strtolower($desc), 'not a member')) {
                $desc .= ' (Bot belum ditambahkan ke dalam grup/channel tujuan).';
            }

            return [
                'success' => false,
                'message' => "Bot valid (@{$botUsername}), namun gagal mengirim ke Chat ID {$chat}: {$desc}",
                'bot' => [
                    'username' => $botUsername,
                    'name' => $botFirstName,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Telegram connection test error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan koneksi saat menghubungi server Telegram API: ' . $e->getMessage(),
            ];
        }
    }
}

