<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_active ?? false;
    }

    public function rules(): array
    {
        return [
            'search'   => ['nullable', 'string', 'max:255'],
            'status'   => ['nullable', 'string', 'in:all,unread,read'],
            'severity' => ['nullable', 'string', 'in:all,critical,warning,info'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function filters(): array
    {
        return [
            'search'   => $this->filled('search') ? trim((string) $this->input('search')) : null,
            'status'   => $this->input('status', 'all'),
            'severity' => $this->input('severity', 'all'),
        ];
    }
}
