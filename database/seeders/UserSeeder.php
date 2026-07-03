<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users      = ['dev', 'admin', 'user']; 
        $default    = [
            'email_verified_at' => now(),
            'password'          => Hash::make('123'),
            'remember_token'    => Str::random(10)
        ];

        foreach ($users as $value) {
            $user = User::firstOrCreate(
                ['username' => $value],
                [...$default, ...[
                    'name'              => ucwords($value),
                    'email'             => $value . '@gmail.com',
                    'is_active'         => '1',
                ]]
            );
            
            // Assign role only if it's created or doesn't have it
            $user->assignRole($value);
        }
    }
}
