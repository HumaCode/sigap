<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DetectionLogIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view-detection-logs') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:100',
            'filter' => 'nullable|string|in:all,judol,obat,hidden,newpage,uptime',
            'status' => 'nullable|string|in:all,new,reviewed,blocked,false_positive,resolved',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ];
    }

    public function filters(): array
    {
        return [
            'search' => $this->input('search', ''),
            'filter' => $this->input('filter', 'all'),
            'status' => $this->input('status', 'all'),
        ];
    }
}
