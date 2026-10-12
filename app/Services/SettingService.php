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

        // 4. General Settings
        $appName = Setting::getValue('app_name') ?: config('app.name', 'SIGAP Web');
        $picEmail = Setting::getValue('pic_contact_email') ?: '';
        $picWa = Setting::getValue('pic_contact_wa') ?: '';
        $telegramBotToken = Setting::getValue('telegram_bot_token') ?: env('TELEGRAM_BOT_TOKEN', '');
        $telegramChatId = Setting::getValue('telegram_chat_id') ?: env('TELEGRAM_CHAT_ID', '');

        return [
            'ninerouter' => [
                'endpoint' => $nineRouterEndpoint,
                'api_key' => $nineRouterApiKey,
                'model' => $nineRouterModel,
                'available_models' => $nineRouterAvailableModels,
                'has_api_key' => !empty($nineRouterApiKey),
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

                // Auto-save the fetched available models into settings
                Setting::setValue('ninerouter_available_models', $formattedModels, 'ninerouter', false);

                return [
                    'success' => true,
                    'message' => 'Koneksi ke 9Router API berhasil! Berhasil memuat ' . count($formattedModels) . ' model.',
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
}
