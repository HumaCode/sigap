<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'site_id' => 'required|exists:sites,id',
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'severity' => 'required|string',
            'status' => 'required|string',
            'description' => 'nullable|string',
            'payload' => 'nullable|array',
            'detected_at' => 'nullable|date',
        ];
    }
}
