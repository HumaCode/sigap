<?php

namespace App\Repositories\Interfaces;

interface IncidentRepositoryInterface
{
    public function getPaginatedIncidents(int $perPage = 10, array $filters = []);
    public function findById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function getStats();
}
