<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TblUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $rows = [
            [
                'email' => 'admin123@gmail.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'is_admin' => 1,
                'created_at' => $now,
                'created_by' => null,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'email' => 'user1@example.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'is_admin' => 0,
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'email' => 'user2@example.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'is_admin' => 0,
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'email' => 'ahmadbayusetianto@gmail.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'is_admin' => 0,
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
        ];

        foreach ($rows as $row) {
            DB::table('tbl_user')->updateOrInsert(
                ['email' => $row['email']],
                $row
            );
        }
    }
}
