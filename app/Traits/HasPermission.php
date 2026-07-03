<?php

namespace App\Traits;

use Illuminate\Support\Arr;


trait HasPermission
{
    protected $abilities = [
        'index'     => 'read',
        'create'    => 'create',
        'store'     => 'create',
        'show'      => 'show',
        'edit'      => 'update',
        'update'    => 'update',
        'menu'      => 'menu',
        'destroy'   => 'delete',
    ];

    public function callAction($method, $parameters)
    {
        $action = $this->abilities[$method] ?? null;

        if (!$action) {
            return parent::callAction($method, $parameters);
        }

        // Ambil prefix static dari route (misal: 'users' dari 'users/{id}/edit')
        $route = request()->route();
        $staticPath = ltrim($route->getCompiled()->getStaticPrefix(), '/');

        // Optimasi: Gunakan caching lokal (static) agar tidak panggil fungsi berulang kali dalam satu request
        static $allowedUrls = null;
        if ($allowedUrls === null) {
            // Flip agar URL menjadi KEY sehingga pencarian menggunakan isset() jauh lebih cepat (O(1))
            $allowedUrls = array_flip(urlMenu());
        }

        // Pencarian instan (Hash Lookup)
        if (isset($allowedUrls[$staticPath])) {
            $this->authorize("$action $staticPath");
        }

        return parent::callAction($method, $parameters);
    }
}