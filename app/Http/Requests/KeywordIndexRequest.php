<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KeywordIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view-keywords') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:100',
            'filter' => 'nullable|string|in:all,judol,obat,hidden,newpage,phising,lainnya',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ];
    }

    public function filters(): array
    {
        return [
            'search' => $this->input('search', ''),
            'filter' => $this->input('filter', 'all'),
        ];
    }
}
