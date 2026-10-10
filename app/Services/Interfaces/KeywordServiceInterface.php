<?php

namespace App\Services\Interfaces;

use App\Models\Keyword;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface KeywordServiceInterface
{
    public function getPaginatedKeywords(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    public function getStats(): array;

    public function createKeyword(array $data): Keyword;

    public function updateKeyword(string|int $id, array $data): Keyword;

    public function deleteKeyword(string|int $id): bool;
}
