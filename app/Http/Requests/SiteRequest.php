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
        ];
    }
}
