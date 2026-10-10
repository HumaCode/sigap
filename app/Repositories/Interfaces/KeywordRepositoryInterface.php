<?php

namespace App\Repositories\Interfaces;

use App\Models\Keyword;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface KeywordRepositoryInterface
{
    public function getPaginatedKeywords(array $filters = [], int $perPage = 10): LengthAwarePaginator;
    public function getStats(): array;
    public function create(array $data): Keyword;
    public function update(string|int $id, array $data): Keyword;
    public function delete(string|int $id): bool;
}
