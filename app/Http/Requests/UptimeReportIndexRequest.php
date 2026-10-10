<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UptimeReportIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view-uptime-reports') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:50',
            'range' => 'nullable|string|in:24h,7d,30d,90d',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ];
    }

    public function filters(): array
    {
        return $this->only(['search', 'category', 'range']);
    }
}
