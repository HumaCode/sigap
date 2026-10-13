<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Nonaktifkan pencatatan Activity Log selama proses seeding agar log tidak penuh
        if (function_exists('activity')) {
            activity()->disableLogging();
        }

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            MenuSeeder::class,
            SiteSeeder::class,
            IncidentSeeder::class,
            NotificationSeeder::class,
            KeywordSeeder::class,
        ]);

        // Pastikan tabel activity_log bersih dari log proses seeder
        \Illuminate\Support\Facades\DB::table('activity_log')->truncate();

        // Aktifkan kembali Activity Log untuk operasional normal aplikasi
        if (function_exists('activity')) {
            activity()->enableLogging();
        }
    }
}
