<?php

namespace App\Repositories;

use App\Models\Keyword;
use App\Repositories\Interfaces\KeywordRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KeywordRepository implements KeywordRepositoryInterface
{
    public function __construct(protected Keyword $model) {}

    public function getPaginatedKeywords(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = $this->model->with('creator');

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('keyword', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if (!empty($filters['filter']) && $filters['filter'] !== 'all') {
            $query->where('category', $filters['filter']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getStats(): array
    {
        return [
            'total' => $this->model->count(),
            'judol' => $this->model->where('category', 'judol')->count(),
            'obat' => $this->model->where('category', 'obat')->count(),
            'regex' => $this->model->where('type', 'regex')->where('is_active', true)->count(),
        ];
    }

    public function create(array $data): Keyword
    {
        return $this->model->create($data);
    }

    public function update(string|int $id, array $data): Keyword
    {
        $keyword = $this->model->findOrFail($id);
        $keyword->update($data);
        return $keyword;
    }

    public function delete(string|int $id): bool
    {
        $keyword = $this->model->findOrFail($id);
        return (bool) $keyword->delete();
    }
}
