<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Shield\Role;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rolesData = [
            [
                'name' => 'dev',
                'slug' => 'developer',
                'type_role' => 'system',
                'description' => 'Super Administrator / Developer',
                'guard_name' => 'web',
                'is_active' => '1',
            ],
            [
                'name' => 'admin',
                'slug' => 'administrator',
                'type_role' => 'management',
                'description' => 'Administrator OPD',
                'guard_name' => 'web',
                'is_active' => '1',
            ],
            [
                'name' => 'user',
                'slug' => 'pengguna',
                'type_role' => 'general',
                'description' => 'Pengguna Biasa / Viewer',
                'guard_name' => 'web',
                'is_active' => '1',
            ],
        ];

        foreach ($rolesData as $roleData) {
            $role = Role::firstOrCreate(['name' => $roleData['name']], $roleData);
            
            $user = User::firstOrCreate([
                'username' => $roleData['name'],
            ], [
                'name' => ucwords(str_replace('-', ' ', $roleData['slug'])),
                'email' => $roleData['name'] . '@sijaga.gov.id',
                'password' => Hash::make('123'),
                'is_active' => 1,
            ]);

            $user->assignRole($role);
        }
    }
}
