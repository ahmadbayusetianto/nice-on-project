<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $cpnsBundlingId = DB::table('tbl_paket')->insertGetId([
            'kategori' => 'CPNS',
            'nama_paket' => 'Bundling Lengkap CPNS',
            'tipe_paket' => 'bundling',
            'harga' => 1900000,
            'ket' => 'Paket bundling berisi CPNS Starter Pack, CPNS Full Tryout, dan Paket Intensif CPNS.',
            'created_at' => $now,
            'created_by' => 1,
            'updated_at' => null,
            'updated_by' => null,
        ]);

        $pppkBundlingId = DB::table('tbl_paket')->insertGetId([
            'kategori' => 'PPPK',
            'nama_paket' => 'Bundling Lengkap PPPK',
            'tipe_paket' => 'bundling',
            'harga' => 1900000,
            'ket' => 'Paket bundling berisi PPPK Starter Pack, PPPK Full Tryout, dan Paket Intensif PPPK.',
            'created_at' => $now,
            'created_by' => 1,
            'updated_at' => null,
            'updated_by' => null,
        ]);

        DB::table('tbl_paket')->insert([
            [
                'kategori' => 'CPNS',
                'formasi' => 'TWK + TIU + TKP',
                'jadwal' => 'Senin-Rabu 19:00',
                'nama_paket' => 'Paket Intensif CPNS',
                'tipe_paket' => 'tunggal',
                'bundling_id' => $cpnsBundlingId,
                'harga' => 750000,
                'ket' => 'Kelas intensif CPNS dengan fokus latihan terarah.',
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'CPNS',
                'formasi' => 'SKD Tryout',
                'jadwal' => 'Kamis 19:00',
                'nama_paket' => 'CPNS Full Tryout',
                'tipe_paket' => 'tunggal',
                'bundling_id' => $cpnsBundlingId,
                'harga' => 650000,
                'ket' => 'Simulasi tryout CPNS lengkap dengan pembahasan.',
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'CPNS',
                'formasi' => 'Materi Dasar',
                'jadwal' => 'Sabtu 09:00',
                'nama_paket' => 'CPNS Starter Pack',
                'tipe_paket' => 'tunggal',
                'bundling_id' => $cpnsBundlingId,
                'harga' => 500000,
                'ket' => 'Paket awal untuk membangun fondasi materi CPNS.',
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'PPPK',
                'formasi' => 'Teknis',
                'jadwal' => 'Selasa-Kamis 19:00',
                'nama_paket' => 'Paket Intensif PPPK',
                'tipe_paket' => 'tunggal',
                'bundling_id' => $pppkBundlingId,
                'harga' => 650000,
                'ket' => 'Kelas intensif PPPK dengan fokus latihan terarah.',
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'PPPK',
                'formasi' => 'Tryout Teknis',
                'jadwal' => 'Jumat 19:00',
                'nama_paket' => 'PPPK Full Tryout',
                'tipe_paket' => 'tunggal',
                'bundling_id' => $pppkBundlingId,
                'harga' => 700000,
                'ket' => 'Simulasi tryout PPPK lengkap dengan evaluasi.',
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'PPPK',
                'formasi' => 'Materi Dasar',
                'jadwal' => 'Sabtu 09:00',
                'nama_paket' => 'PPPK Starter Pack',
                'tipe_paket' => 'tunggal',
                'bundling_id' => $pppkBundlingId,
                'harga' => 550000,
                'ket' => 'Paket awal untuk membangun fondasi materi PPPK.',
                'created_at' => $now,
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
        ]);
    }
}
