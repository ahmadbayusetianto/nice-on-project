<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FAQSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tbl_faq')->insert([
            [
                'kategori' => 'Umum',
                'pertanyaan' => 'Lorem ipsum dolor sit amet consectetur?',
                'jawaban' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.',
                'ikon' => '❓',
                'urutan' => 1,
                'is_active' => 1,
                'created_at' => now(),
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'Umum',
                'pertanyaan' => 'Consectetur adipiscing elit sed do eiusmod?',
                'jawaban' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.',
                'ikon' => '📘',
                'urutan' => 2,
                'is_active' => 1,
                'created_at' => now(),
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'Umum',
                'pertanyaan' => 'Tempor incididunt ut labore et dolore?',
                'jawaban' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.',
                'ikon' => '💬',
                'urutan' => 3,
                'is_active' => 1,
                'created_at' => now(),
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'Program',
                'pertanyaan' => 'Magna aliqua ut enim ad minim veniam?',
                'jawaban' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.',
                'ikon' => '🎓',
                'urutan' => 4,
                'is_active' => 1,
                'created_at' => now(),
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'Program',
                'pertanyaan' => 'Quis nostrud exercitation ullamco laboris?',
                'jawaban' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.',
                'ikon' => '🧩',
                'urutan' => 5,
                'is_active' => 1,
                'created_at' => now(),
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
            [
                'kategori' => 'Program',
                'pertanyaan' => 'Nisi ut aliquip ex ea commodo consequat?',
                'jawaban' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.',
                'ikon' => '🛡️',
                'urutan' => 6,
                'is_active' => 1,
                'created_at' => now(),
                'created_by' => 1,
                'updated_at' => null,
                'updated_by' => null,
            ],
        ]);
    }
}
