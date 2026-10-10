<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDetectionLogStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-detection-status') ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:new,reviewed,blocked,false_positive,resolved',
        ];
    }
}
