<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuestionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $questions = [
            [
                'question' => 'Pancasila sebagai dasar negara Indonesia ditetapkan pada tanggal berapa?',
                'question_group' => 1,
                'information' => 'Materi dasar wawasan kebangsaan.',
                'pembahasan' => 'Pancasila sebagai dasar negara secara historis dikaitkan dengan sidang BPUPKI pada 1 Juni 1945.',
                'options' => [
                    ['choise' => '1 Juni 1945', 'answer' => true],
                    ['choise' => '17 Agustus 1945', 'answer' => false],
                    ['choise' => '22 Juni 1945', 'answer' => false],
                    ['choise' => '18 Agustus 1945', 'answer' => false],
                ],
            ],
            [
                'question' => 'Semboyan negara Indonesia adalah ...',
                'question_group' => 1,
                'information' => 'Lambang negara Garuda Pancasila.',
                'pembahasan' => 'Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu.',
                'options' => [
                    ['choise' => 'Bersatu kita teguh', 'answer' => false],
                    ['choise' => 'Bhinneka Tunggal Ika', 'answer' => true],
                    ['choise' => 'Tut Wuri Handayani', 'answer' => false],
                    ['choise' => 'Ing Ngarso Sung Tulodo', 'answer' => false],
                ],
            ],
            [
                'question' => 'Lembaga negara yang berwenang menguji undang-undang terhadap UUD 1945 adalah ...',
                'question_group' => 1,
                'information' => 'Kewenangan konstitusional lembaga yudikatif.',
                'pembahasan' => 'Mahkamah Konstitusi berwenang menguji undang-undang terhadap UUD 1945.',
                'options' => [
                    ['choise' => 'Mahkamah Agung', 'answer' => false],
                    ['choise' => 'Mahkamah Konstitusi', 'answer' => true],
                    ['choise' => 'Komisi Yudisial', 'answer' => false],
                    ['choise' => 'Dewan Perwakilan Rakyat', 'answer' => false],
                ],
            ],
            [
                'question' => 'Hasil dari 18 x 7 - 24 adalah ...',
                'question_group' => 2,
                'information' => 'Hitung cepat dasar.',
                'pembahasan' => '18 x 7 = 126. 126 - 24 = 102.',
                'options' => [
                    ['choise' => '96', 'answer' => false],
                    ['choise' => '100', 'answer' => false],
                    ['choise' => '102', 'answer' => true],
                    ['choise' => '108', 'answer' => false],
                ],
            ],
            [
                'question' => 'Jika 3 pekerja menyelesaikan pekerjaan dalam 12 hari, maka 6 pekerja dengan kemampuan sama akan selesai dalam ... hari.',
                'question_group' => 2,
                'information' => 'Perbandingan berbalik nilai.',
                'pembahasan' => 'Jumlah pekerja naik dua kali, waktu turun menjadi setengah: 12 / 2 = 6 hari.',
                'options' => [
                    ['choise' => '4', 'answer' => false],
                    ['choise' => '6', 'answer' => true],
                    ['choise' => '8', 'answer' => false],
                    ['choise' => '10', 'answer' => false],
                ],
            ],
            [
                'question' => 'Deret angka berikut yang tepat setelah 2, 4, 8, 16 adalah ...',
                'question_group' => 2,
                'information' => 'Pola perkalian dua.',
                'pembahasan' => 'Setiap angka dikali 2, sehingga angka berikutnya adalah 32.',
                'options' => [
                    ['choise' => '24', 'answer' => false],
                    ['choise' => '30', 'answer' => false],
                    ['choise' => '32', 'answer' => true],
                    ['choise' => '34', 'answer' => false],
                ],
            ],
            [
                'question' => 'Pegawai tetap tenang saat menghadapi komplain berat dari peserta layanan. Sikap ini menunjukkan ...',
                'question_group' => 3,
                'information' => 'Aspek pelayanan publik.',
                'pembahasan' => 'Tetap tenang dan responsif saat menghadapi komplain menunjukkan pengendalian diri dan orientasi pelayanan.',
                'options' => [
                    ['choise' => 'Kepanikan', 'answer' => false],
                    ['choise' => 'Pengendalian diri', 'answer' => true],
                    ['choise' => 'Ketidakpedulian', 'answer' => false],
                    ['choise' => 'Keengganan bekerja', 'answer' => false],
                ],
            ],
            [
                'question' => 'Saat rekan kerja meminta bantuan untuk menyelesaikan tugas yang mendesak, tindakan terbaik adalah ...',
                'question_group' => 3,
                'information' => 'Konteks kerja tim.',
                'pembahasan' => 'Kerja sama dan saling membantu adalah bagian dari orientasi pelayanan dan kolaborasi.',
                'options' => [
                    ['choise' => 'Menolak tanpa alasan', 'answer' => false],
                    ['choise' => 'Membantu sesuai prioritas pekerjaan', 'answer' => true],
                    ['choise' => 'Menyalahkan rekan kerja', 'answer' => false],
                    ['choise' => 'Mengabaikan permintaan', 'answer' => false],
                ],
            ],
            [
                'question' => 'Ketika aturan kerja baru diterapkan, sikap yang paling tepat adalah ...',
                'question_group' => 3,
                'information' => 'Adaptasi terhadap perubahan.',
                'pembahasan' => 'Pegawai perlu adaptif, mengikuti aturan, dan berkomitmen pada perubahan yang mendukung kinerja.',
                'options' => [
                    ['choise' => 'Menolak perubahan', 'answer' => false],
                    ['choise' => 'Mempelajari dan menyesuaikan diri', 'answer' => true],
                    ['choise' => 'Membiarkan pekerjaan menumpuk', 'answer' => false],
                    ['choise' => 'Mengabaikan instruksi', 'answer' => false],
                ],
            ],
        ];

        DB::transaction(function () use ($questions, $now) {
            foreach ($questions as $question) {
                $questionId = DB::table('tbl_questions')->insertGetId([
                    'question' => $question['question'],
                    'question_type' => 'single',
                    'question_group' => $question['question_group'],
                    'istext' => true,
                    'information' => $question['information'],
                    'pembahasan' => $question['pembahasan'],
                    'created_at' => $now,
                    'updated_at' => null,
                    'deleted_at' => null,
                ]);

                foreach ($question['options'] as $option) {
                    DB::table('tbl_question_options')->insert([
                        'question_id' => $questionId,
                        'choise' => $option['choise'],
                        'answer' => $option['answer'] ? 1 : 0,
                        'istext' => true,
                        'created_at' => $now,
                        'updated_at' => null,
                        'deleted_at' => null,
                    ]);
                }
            }
        });
    }
}
