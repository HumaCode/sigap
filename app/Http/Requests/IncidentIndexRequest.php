<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IncidentIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('view-incidents') ?? ($this->user()?->is_active ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search'   => ['nullable', 'string', 'max:255'],
            'status'   => ['nullable', 'string', 'in:all,critical,open,investigating,acknowledged,resolved,false_positive'],
            'type'     => ['nullable', 'string', 'max:50'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Helper to retrieve cleaned filters.
     */
    public function filters(): array
    {
        $search = $this->filled('search') ? trim((string) $this->input('search')) : null;
        $status = $this->input('status', 'all');
        $type   = $this->input('type', 'all');

        return [
            'search' => $search,
            'status' => $status,
            'type'   => $type,
        ];
    }
}
