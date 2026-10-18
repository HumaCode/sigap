<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasAnyRole(['dev', 'admin']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'group' => 'required|string|in:ninerouter,sso,seo,activity_log,general',
            'settings' => 'required|array',
            // SSO rules
            'settings.sso_enabled' => 'nullable|boolean',
            'settings.sso_app_name' => 'nullable|string|max:100',
            'settings.sso_base_url' => 'nullable|string|max:255',
            'settings.sso_client_id' => 'nullable|string|max:255',
            'settings.sso_client_secret' => 'nullable|string|max:500',
            'settings.sso_redirect_uri' => 'nullable|string|max:255',
            'settings.sso_logout_uri' => 'nullable|string|max:255',
            'settings.sso_scopes' => 'nullable|array',
            'settings.sso_first_party' => 'nullable|boolean',
            // 9Router rules
            'settings.endpoint' => 'nullable|string|url|max:255',
            'settings.api_key' => 'nullable|string|max:500',
            'settings.model' => 'nullable|string|max:100',
            'settings.available_models' => 'nullable|array',
            // SEO rules
            'settings.meta_title' => 'nullable|string|max:255',
            'settings.meta_description' => 'nullable|string|max:1000',
            'settings.meta_keywords' => 'nullable|string|max:500',
            'settings.author' => 'nullable|string|max:255',
            'settings.robots_index' => 'nullable|boolean',
            'settings.google_verification' => 'nullable|string|max:255',
            // Activity log rules
            'settings.retention_days' => 'nullable|integer|min:1|max:365',
            'settings.log_level' => 'nullable|string|in:debug,info,warning,error',
            'settings.auto_prune' => 'nullable|boolean',
            'settings.auto_backup_enabled' => 'nullable|boolean',
            // General rules
            'settings.app_name' => 'nullable|string|max:100',
            'settings.pic_contact_email' => 'nullable|email|max:150',
            'settings.pic_contact_wa' => 'nullable|string|max:50',
            'settings.telegram_bot_token' => 'nullable|string|max:255',
            'settings.telegram_chat_id' => 'nullable|string|max:100',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     */
    public function attributes(): array
    {
        return [
            'settings.endpoint' => 'URL Endpoint 9Router',
            'settings.api_key' => 'API Key 9Router',
            'settings.model' => 'Pilihan Model AI Default',
            'settings.meta_title' => 'Judul Meta SEO',
            'settings.meta_description' => 'Deskripsi Meta SEO',
            'settings.meta_keywords' => 'Kata Kunci Meta SEO',
            'settings.retention_days' => 'Masa Retensi Log',
            'settings.pic_contact_email' => 'Email PIC',
            'settings.pic_contact_wa' => 'Nomor WhatsApp PIC',
        ];
    }
}
