<?php

namespace App\Services;

use App\Repositories\Interfaces\KeywordRepositoryInterface;

class KeywordService
{
    public function __construct(protected KeywordRepositoryInterface $keywordRepository) {}

    public function getPaginatedKeywords(array $filters, int $perPage = 10)
    {
        return $this->keywordRepository->getPaginatedKeywords($filters, $perPage);
    }

    public function createKeyword(array $data)
    {
        // Add created_by if running with authenticated user
        if (auth()->check()) {
            $data['created_by'] = auth()->id();
        }
        
        return $this->keywordRepository->create($data);
    }

    public function updateKeyword(string $id, array $data)
    {
        return $this->keywordRepository->update($id, $data);
    }

    public function deleteKeyword(string $id)
    {
        return $this->keywordRepository->delete($id);
    }
}
