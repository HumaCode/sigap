<?php

namespace App\Repositories\Interfaces;

interface SiteRepositoryInterface
{
    public function getAllPaginated($perPage = 10, $search = '', $filter = 'all');
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function find($id);
}
