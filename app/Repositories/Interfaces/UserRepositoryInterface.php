<?php

namespace App\Repositories\Interfaces;

interface UserRepositoryInterface
{
    public function getPaginatedUsers(int $perPage = 10, array $filters = []);
    public function findById(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
    public function toggleStatus(string $id);
    public function getStats(): array;
    public function getAllRoles();
}
