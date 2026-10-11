<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserServiceInterface
{
    public function getPaginatedUsers(int $perPage = 10, array $filters = []): LengthAwarePaginator;

    public function getStats(): array;

    public function getRoles();

    public function getUserById(string $id): User;

    public function createUser(array $data): User;

    public function updateUser(string $id, array $data): User;

    public function deleteUser(string $id): bool;

    public function toggleStatus(string $id): User;
}
