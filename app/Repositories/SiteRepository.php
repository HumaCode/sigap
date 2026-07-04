<?php

namespace App\Repositories;

use App\Models\Site;
use App\Repositories\Interfaces\SiteRepositoryInterface;

class SiteRepository implements SiteRepositoryInterface
{
    public function getAllPaginated($perPage = 10, $search = '', $filter = 'all')
    {
        $query = Site::query();
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%");
            });
        }
        if ($filter !== 'all' && $filter) {
            if ($filter === 'paused') {
                $query->where('is_active', false);
            } else {
                $query->where('status', $filter)->where('is_active', true);
            }
        }
        return $query->latest()->paginate($perPage);
    }
    
    public function create(array $data) { return Site::create($data); }
    public function update($id, array $data) { 
        $site = Site::findOrFail($id);
        $site->update($data);
        return $site;
    }
    public function delete($id) { return Site::destroy($id); }
    public function find($id) { return Site::findOrFail($id); }
}
