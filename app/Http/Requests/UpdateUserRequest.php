<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name'      => 'required|string|max:255',
            'username'  => 'required|string|max:255|unique:users,username,' . $userId,
            'email'     => 'required|string|email|max:255|unique:users,email,' . $userId,
            'password'  => 'nullable|string|min:3',
            'role'      => 'required|string|exists:roles,name',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Nama lengkap wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.unique'   => 'Username ini sudah digunakan.',
            'email.required'    => 'Alamat email wajib diisi.',
            'email.email'       => 'Format email tidak valid.',
            'email.unique'      => 'Alamat email ini sudah terdaftar.',
            'password.min'      => 'Password minimal 3 karakter.',
            'role.required'     => 'Peran/Role wajib dipilih.',
            'role.exists'       => 'Peran yang dipilih tidak valid.',
        ];
    }
}
