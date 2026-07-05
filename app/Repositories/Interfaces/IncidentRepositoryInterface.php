<?php

namespace App\Repositories\Interfaces;

interface IncidentRepositoryInterface
{
    public function getPaginatedIncidents(int $perPage = 10, array $filters = []);
    public function findById(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
    public function getStats();
}
