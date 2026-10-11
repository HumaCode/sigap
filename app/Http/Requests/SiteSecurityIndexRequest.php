<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SiteSecurityIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('view-site-security') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'filter' => ['nullable', 'string', 'in:all,critical,warn,clean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Helper to retrieve cleaned filters.
     */
    public function filters(): array
    {
        $search = $this->filled('search') ? trim((string) $this->input('search')) : null;
        $filter = in_array($this->input('filter'), ['critical', 'warn', 'clean']) ? (string) $this->input('filter') : 'all';

        return [
            'search' => $search,
            'filter' => $filter,
        ];
    }
}
