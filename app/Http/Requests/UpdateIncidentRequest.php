<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'site_id' => 'sometimes|required|exists:sites,id',
            'title' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string',
            'severity' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'payload' => 'nullable|array',
            'detected_at' => 'nullable|date',
        ];
    }
}
