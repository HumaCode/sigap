<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Traits\HasMenuPermission;
use App\Models\Menu;

class MenuSeeder extends Seeder
{
    use HasMenuPermission;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Kosongkan tabel sebelum melakukan seeding agar tidak duplikat
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('menus')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $menus = [
            // Menu Utama
            [
                'name' => 'Dashboard',
                'url' => 'dashboard',
                'category' => 'Menu Utama',
                'icon' => 'bi bi-grid-1x2-fill',
                'orders' => 1,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Daftar Situs',
                'url' => 'sites.index',
                'category' => 'Menu Utama',
                'icon' => 'bi bi-hdd-network',
                'orders' => 2,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Insiden Keamanan',
                'url' => 'incidents.index',
                'category' => 'Pemantauan',
                'icon' => 'bi bi-shield-exclamation',
                'orders' => 2,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Laporan Uptime',
                'url' => 'reports.uptime',
                'category' => 'Menu Utama',
                'icon' => 'bi bi-graph-up-arrow',
                'orders' => 4,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],

            // Deteksi
            [
                'name' => 'Log Deteksi Konten',
                'url' => 'logs.detection',
                'category' => 'Deteksi',
                'icon' => 'bi bi-bug-fill',
                'orders' => 1,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Kamus Kata Kunci',
                'url' => 'keywords.index',
                'category' => 'Deteksi',
                'icon' => 'bi bi-journal-code',
                'orders' => 6,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Keamanan Situs',
                'url' => 'security.index',
                'category' => 'Deteksi',
                'icon' => 'bi bi-shield-exclamation',
                'orders' => 7,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],

            // Sistem
            [
                'name' => 'Pengguna & Peran',
                'url' => 'users.index',
                'category' => 'Sistem',
                'icon' => 'bi bi-people',
                'orders' => 8,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Notifikasi',
                'url' => 'notifications.index',
                'category' => 'Sistem',
                'icon' => 'bi bi-bell',
                'orders' => 9,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
            [
                'name' => 'Pengaturan',
                'url' => 'profile.edit',
                'category' => 'Sistem',
                'icon' => 'bi bi-gear',
                'orders' => 10,
                'permissions' => ['menu', 'create', 'read', 'show', 'update', 'delete', 'activate'],
            ],
        ];

        foreach ($menus as $item) {
            $permissions = $item['permissions'];
            unset($item['permissions']); // Hapus sebelum dimasukkan ke database table
            
            $item['id'] = Str::ulid()->toString();
            $item['is_active'] = true;
            $item['created_at'] = now();
            $item['updated_at'] = now();

            DB::table('menus')->insert($item);

            // Retrieve instance untuk dimasukkan ke fungsi attachMenupermission
            $menuModel = Menu::find($item['id']);
            
            if ($menuModel) {
                $this->attachMenupermission($menuModel, $permissions, ['dev']);
            }
        }
    }
}
