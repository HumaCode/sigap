<?php

namespace App\Services;

use App\Models\Keyword;
use App\Repositories\Interfaces\KeywordRepositoryInterface;
use App\Services\Interfaces\KeywordServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KeywordService implements KeywordServiceInterface
{
    public function __construct(protected KeywordRepositoryInterface $keywordRepository) {}

    public function getPaginatedKeywords(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->keywordRepository->getPaginatedKeywords($filters, $perPage);
    }

    public function getStats(): array
    {
        return $this->keywordRepository->getStats();
    }

    public function createKeyword(array $data): Keyword
    {
        // Add created_by if running with authenticated user
        if (auth()->check()) {
            $data['created_by'] = auth()->id();
        }
        
        return $this->keywordRepository->create($data);
    }

    public function updateKeyword(string|int $id, array $data): Keyword
    {
        return $this->keywordRepository->update($id, $data);
    }

    public function deleteKeyword(string|int $id): bool
    {
        return $this->keywordRepository->delete($id);
    }
}
