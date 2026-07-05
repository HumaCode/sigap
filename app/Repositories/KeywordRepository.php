<?php

namespace App\Repositories;

use App\Models\Keyword;
use App\Repositories\Interfaces\KeywordRepositoryInterface;

class KeywordRepository implements KeywordRepositoryInterface
{
    public function __construct(protected Keyword $model) {}

    public function getPaginatedKeywords(array $filters, int $perPage = 10)
    {
        $query = $this->model->with('creator');

        if (!empty($filters['search'])) {
            $query->where('keyword', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['filter']) && $filters['filter'] !== 'all') {
            $query->where('category', $filters['filter']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data)
    {
        $keyword = $this->model->findOrFail($id);
        $keyword->update($data);
        return $keyword;
    }

    public function delete(string $id)
    {
        $keyword = $this->model->findOrFail($id);
        return $keyword->delete();
    }
}
