<?php

namespace App\Repositories\Interfaces;

interface KeywordRepositoryInterface
{
    public function getPaginatedKeywords(array $filters, int $perPage = 10);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
}
