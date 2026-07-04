<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Site;

class SiteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sites = [
            [
                'name' => 'Portal Utama Kota Pekalongan',
                'url' => 'pekalongankota.go.id',
                'category' => 'Portal Utama',
                'pic_name' => 'Budi S.',
                'check_interval' => 5,
                'status' => 'up',
            ],
            [
                'name' => 'PPID Kota Pekalongan',
                'url' => 'ppid.pekalongankota.go.id',
                'category' => 'PPID',
                'pic_name' => 'Siti R.',
                'check_interval' => 5,
                'status' => 'down',
            ],
            [
                'name' => 'SPBE Kota Pekalongan',
                'url' => 'spbe.pekalongankota.go.id',
                'category' => 'SPBE',
                'pic_name' => 'Ahmad F.',
                'check_interval' => 10,
                'status' => 'up',
            ],
            [
                'name' => 'SIPEKA',
                'url' => 'sipeka.pekalongankota.go.id',
                'category' => 'Lainnya',
                'pic_name' => 'Dewi K.',
                'check_interval' => 5,
                'status' => 'warn',
            ],
            [
                'name' => 'SIAKAD Terpadu',
                'url' => 'siakad.pekalongankota.go.id',
                'category' => 'Lainnya',
                'pic_name' => 'Rian P.',
                'check_interval' => 5,
                'status' => 'up',
            ],
            [
                'name' => 'RAPBD Information System',
                'url' => 'rapbd.pekalongankota.go.id',
                'category' => 'Lainnya',
                'pic_name' => 'Tono W.',
                'check_interval' => 0, // dijeda
                'status' => 'paused',
            ],
        ];

        foreach ($sites as $site) {
            Site::create($site);
        }
    }
}
