<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UserIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', User::class) ?? false;
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
            'role'     => ['nullable', 'string', 'max:50'],
            'status'   => ['nullable', 'string', 'in:all,active,inactive'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Helper to retrieve cleaned filters.
     */
    public function filters(): array
    {
        $search = $this->filled('search') ? trim((string) $this->input('search')) : null;
        $role   = $this->input('role', 'all');
        $status = $this->input('status', 'all');

        return [
            'search' => $search,
            'role'   => $role,
            'status' => $status,
        ];
    }
}
