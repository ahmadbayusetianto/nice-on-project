<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParameterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $rows = [
            ['kode' => 'app.name', 'nama' => 'Nama Aplikasi', 'kategori' => 'Aplikasi', 'nilai' => 'Nice On Learning Hub', 'tipe' => 'text', 'deskripsi' => 'Nama utama aplikasi.'],
            ['kode' => 'app.currency', 'nama' => 'Mata Uang Default', 'kategori' => 'Keuangan', 'nilai' => 'IDR', 'tipe' => 'text', 'deskripsi' => 'Mata uang yang digunakan.'],
            ['kode' => 'mail.from.address', 'nama' => 'Email Pengirim', 'kategori' => 'Email & Notifikasi', 'nilai' => 'noreply@niceon.id', 'tipe' => 'text', 'deskripsi' => 'Email default untuk pengiriman.'],
            ['kode' => 'tax.ppn', 'nama' => 'PPN (%)', 'kategori' => 'Keuangan', 'nilai' => '11', 'tipe' => 'number', 'deskripsi' => 'Persentase pajak pertambahan nilai.'],
            ['kode' => 'academic.year', 'nama' => 'Tahun Ajaran Aktif', 'kategori' => 'Aplikasi', 'nilai' => '2025/2026', 'tipe' => 'text', 'deskripsi' => 'Tahun ajaran yang sedang berjalan.'],
            ['kode' => 'payment.methods', 'nama' => 'Metode Pembayaran Aktif', 'kategori' => 'Keuangan', 'nilai' => 'bank_transfer,ewallet', 'tipe' => 'select', 'deskripsi' => 'Metode pembayaran yang tersedia.'],
            ['kode' => 'session.lifetime', 'nama' => 'Durasi Sesi (menit)', 'kategori' => 'Aplikasi', 'nilai' => '120', 'tipe' => 'number', 'deskripsi' => 'Durasi sesi login pengguna.'],
            ['kode' => 'upload.max_size', 'nama' => 'Ukuran Upload Maks (MB)', 'kategori' => 'Lainnya', 'nilai' => '10', 'tipe' => 'number', 'deskripsi' => 'Batas maksimal ukuran file upload.'],
        ];

        foreach ($rows as $row) {
            DB::table('tbl_parameter')->updateOrInsert(
                ['kode' => $row['kode']],
                [
                    'nama' => $row['nama'],
                    'kategori' => $row['kategori'],
                    'nilai' => $row['nilai'],
                    'tipe' => $row['tipe'],
                    'deskripsi' => $row['deskripsi'],
                    'is_active' => 1,
                    'created_at' => $now,
                    'created_by' => 1,
                    'updated_at' => null,
                    'updated_by' => null,
                ]
            );
        }
    }
}
