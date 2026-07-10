<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SiteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'url' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_contact' => 'nullable|string|max:255',
            'check_interval' => 'nullable|integer',
            'sitemap_url' => 'nullable|string',
            'critical_pages' => 'nullable|array',
            'ssh_host' => 'nullable|string|max:255',
            'ssh_port' => 'nullable|integer',
            'ssh_username' => 'nullable|string|max:255',
            'ssh_auth_type' => 'nullable|string|in:password,key',
            'ssh_password' => 'nullable|string',
            'ssh_private_key' => 'nullable|string',
            'ssh_app_path' => 'nullable|string|max:255',
        ];
    }
}
