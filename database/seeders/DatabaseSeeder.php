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
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            MenuSeeder::class,
            SiteSeeder::class,
            IncidentSeeder::class,
            NotificationSeeder::class,
            KeywordSeeder::class,
        ]);
    }
}
