<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SiteSecurityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('scan-site-security') ?? false;
    }

    public function rules(): array
    {
        return [
            'site_id' => ['nullable', 'string', 'exists:sites,id'],
        ];
    }
}
