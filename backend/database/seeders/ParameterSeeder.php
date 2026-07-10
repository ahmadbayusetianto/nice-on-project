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
            ['kode' => 'app.name', 'nama' => 'Nama Aplikasi', 'kategori' => 'General', 'nilai' => 'NICE ON Learning Hub', 'tipe' => 'text', 'deskripsi' => 'Nama utama aplikasi.'],
            ['kode' => 'app.version', 'nama' => 'Versi Aplikasi', 'kategori' => 'General', 'nilai' => '1.0.0', 'tipe' => 'text', 'deskripsi' => 'Versi aplikasi yang ditampilkan di admin.'],
            ['kode' => 'company.name', 'nama' => 'Company Name', 'kategori' => 'General', 'nilai' => 'PT NICE ON', 'tipe' => 'text', 'deskripsi' => 'Nama perusahaan.'],
            ['kode' => 'support.email', 'nama' => 'Email Support', 'kategori' => 'General', 'nilai' => 'support@niceon.id', 'tipe' => 'text', 'deskripsi' => 'Email kontak support.'],
            ['kode' => 'support.whatsapp', 'nama' => 'Nomor WhatsApp', 'kategori' => 'General', 'nilai' => '0812xxxx', 'tipe' => 'text', 'deskripsi' => 'Nomor WhatsApp layanan.'],
            ['kode' => 'app.timezone', 'nama' => 'Timezone', 'kategori' => 'General', 'nilai' => 'Asia/Jakarta', 'tipe' => 'text', 'deskripsi' => 'Timezone default aplikasi.'],
            ['kode' => 'app.default_locale', 'nama' => 'Bahasa Default', 'kategori' => 'General', 'nilai' => 'id', 'tipe' => 'select', 'deskripsi' => 'Locale default aplikasi.'],
            ['kode' => 'app.logo_login', 'nama' => 'Logo Login', 'kategori' => 'General', 'nilai' => 'logo.png', 'tipe' => 'text', 'deskripsi' => 'Logo yang digunakan di halaman login.'],
            ['kode' => 'app.favicon', 'nama' => 'Favicon', 'kategori' => 'General', 'nilai' => 'favicon.ico', 'tipe' => 'text', 'deskripsi' => 'Ikon tab browser.'],

            ['kode' => 'system.maintenance_mode', 'nama' => 'Maintenance Mode', 'kategori' => 'Sistem', 'nilai' => '0', 'tipe' => 'boolean', 'deskripsi' => 'Aktifkan mode perawatan aplikasi.'],
            ['kode' => 'system.session_timeout', 'nama' => 'Session Timeout', 'kategori' => 'Sistem', 'nilai' => '30', 'tipe' => 'number', 'deskripsi' => 'Durasi timeout sesi login dalam menit.'],
            ['kode' => 'system.login_max_attempt', 'nama' => 'Login Max Attempt', 'kategori' => 'Sistem', 'nilai' => '5', 'tipe' => 'number', 'deskripsi' => 'Batas percobaan login gagal.'],
            ['kode' => 'system.otp_expired_minute', 'nama' => 'OTP Expired Minute', 'kategori' => 'Sistem', 'nilai' => '5', 'tipe' => 'number', 'deskripsi' => 'Waktu kedaluwarsa OTP dalam menit.'],
            ['kode' => 'system.password_expired_day', 'nama' => 'Password Expired Day', 'kategori' => 'Sistem', 'nilai' => '90', 'tipe' => 'number', 'deskripsi' => 'Umur password dalam hari.'],
            ['kode' => 'system.max_upload_size', 'nama' => 'Max Upload Size', 'kategori' => 'Sistem', 'nilai' => '5', 'tipe' => 'number', 'deskripsi' => 'Batas maksimal ukuran upload dalam MB.'],
            ['kode' => 'system.allowed_image_extension', 'nama' => 'Allowed Image Extension', 'kategori' => 'Sistem', 'nilai' => 'jpg,jpeg,png,webp', 'tipe' => 'select', 'deskripsi' => 'Ekstensi gambar yang diizinkan.'],
            ['kode' => 'system.allowed_document_extension', 'nama' => 'Allowed Document Extension', 'kategori' => 'Sistem', 'nilai' => 'pdf,doc,docx,xls,xlsx', 'tipe' => 'select', 'deskripsi' => 'Ekstensi dokumen yang diizinkan.'],

            ['kode' => 'exam.default_duration', 'nama' => 'Durasi Default Ujian', 'kategori' => 'CAT / Ujian', 'nilai' => '100', 'tipe' => 'number', 'deskripsi' => 'Durasi ujian default dalam menit.'],
            ['kode' => 'exam.auto_submit', 'nama' => 'Auto Submit', 'kategori' => 'CAT / Ujian', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Ujian dikumpulkan otomatis saat waktu habis.'],
            ['kode' => 'exam.shuffle_question', 'nama' => 'Acak Soal', 'kategori' => 'CAT / Ujian', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Acak urutan soal saat ujian dimulai.'],
            ['kode' => 'exam.shuffle_option', 'nama' => 'Acak Jawaban', 'kategori' => 'CAT / Ujian', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Acak urutan opsi jawaban.'],
            ['kode' => 'exam.passing_grade_default', 'nama' => 'Passing Grade Default', 'kategori' => 'CAT / Ujian', 'nilai' => '311', 'tipe' => 'number', 'deskripsi' => 'Nilai ambang kelulusan default.'],
            ['kode' => 'exam.min_question_count', 'nama' => 'Minimal Jumlah Soal', 'kategori' => 'CAT / Ujian', 'nilai' => '100', 'tipe' => 'number', 'deskripsi' => 'Jumlah minimal soal ujian.'],
            ['kode' => 'exam.max_question_count', 'nama' => 'Maksimal Jumlah Soal', 'kategori' => 'CAT / Ujian', 'nilai' => '110', 'tipe' => 'number', 'deskripsi' => 'Jumlah maksimal soal ujian.'],
            ['kode' => 'exam.max_attempt', 'nama' => 'Maksimal Percobaan', 'kategori' => 'CAT / Ujian', 'nilai' => '3', 'tipe' => 'number', 'deskripsi' => 'Batas percobaan ujian per user.'],
            ['kode' => 'exam.timer_warning', 'nama' => 'Timer Warning', 'kategori' => 'CAT / Ujian', 'nilai' => '10', 'tipe' => 'number', 'deskripsi' => 'Peringatan tersisa waktu dalam menit.'],
            ['kode' => 'exam.score_correct', 'nama' => 'Nilai Benar', 'kategori' => 'CAT / Ujian', 'nilai' => '5', 'tipe' => 'number', 'deskripsi' => 'Skor untuk jawaban benar.'],
            ['kode' => 'exam.score_wrong', 'nama' => 'Nilai Salah', 'kategori' => 'CAT / Ujian', 'nilai' => '0', 'tipe' => 'number', 'deskripsi' => 'Skor untuk jawaban salah.'],
            ['kode' => 'exam.score_blank', 'nama' => 'Nilai Kosong', 'kategori' => 'CAT / Ujian', 'nilai' => '0', 'tipe' => 'number', 'deskripsi' => 'Skor untuk jawaban kosong.'],

            ['kode' => 'payment.vat', 'nama' => 'PPN', 'kategori' => 'Pembayaran', 'nilai' => '11', 'tipe' => 'number', 'deskripsi' => 'Persentase pajak pertambahan nilai.'],
            ['kode' => 'payment.unique_code', 'nama' => 'Kode Unik', 'kategori' => 'Pembayaran', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Aktifkan kode unik pembayaran.'],
            ['kode' => 'payment.expired_minutes', 'nama' => 'Expired Payment', 'kategori' => 'Pembayaran', 'nilai' => '60', 'tipe' => 'number', 'deskripsi' => 'Batas waktu pembayaran dalam menit.'],
            ['kode' => 'payment.gateway', 'nama' => 'Payment Gateway', 'kategori' => 'Pembayaran', 'nilai' => 'manual', 'tipe' => 'select', 'deskripsi' => 'Gateway pembayaran yang dipakai.'],
            ['kode' => 'payment.bank_account', 'nama' => 'Nomor Rekening', 'kategori' => 'Pembayaran', 'nilai' => '1234567890', 'tipe' => 'text', 'deskripsi' => 'Nomor rekening pembayaran.'],
            ['kode' => 'payment.bank_name', 'nama' => 'Nama Bank', 'kategori' => 'Pembayaran', 'nilai' => 'BCA', 'tipe' => 'text', 'deskripsi' => 'Nama bank penerima.'],

            ['kode' => 'media.max_image_width', 'nama' => 'Max Image Width', 'kategori' => 'Media', 'nilai' => '1920', 'tipe' => 'number', 'deskripsi' => 'Lebar maksimal gambar.'],
            ['kode' => 'media.max_image_height', 'nama' => 'Max Image Height', 'kategori' => 'Media', 'nilai' => '1080', 'tipe' => 'number', 'deskripsi' => 'Tinggi maksimal gambar.'],
            ['kode' => 'media.compress_image', 'nama' => 'Compress Image', 'kategori' => 'Media', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Kompresi gambar saat upload.'],
            ['kode' => 'media.watermark', 'nama' => 'Watermark', 'kategori' => 'Media', 'nilai' => '0', 'tipe' => 'boolean', 'deskripsi' => 'Tambahkan watermark pada media.'],
            ['kode' => 'media.storage_driver', 'nama' => 'Storage Driver', 'kategori' => 'Media', 'nilai' => 'local', 'tipe' => 'select', 'deskripsi' => 'Driver storage media.'],
            ['kode' => 'media.cdn_url', 'nama' => 'CDN URL', 'kategori' => 'Media', 'nilai' => 'https://cdn.niceon.id', 'tipe' => 'text', 'deskripsi' => 'Alamat CDN media.'],

            ['kode' => 'notification.email_active', 'nama' => 'Email Aktif', 'kategori' => 'Notifikasi', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Aktifkan notifikasi email.'],
            ['kode' => 'notification.wa_active', 'nama' => 'WA Aktif', 'kategori' => 'Notifikasi', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Aktifkan notifikasi WhatsApp.'],
            ['kode' => 'notification.push_active', 'nama' => 'Push Notification', 'kategori' => 'Notifikasi', 'nilai' => '0', 'tipe' => 'boolean', 'deskripsi' => 'Aktifkan push notification.'],
            ['kode' => 'notification.smtp_host', 'nama' => 'SMTP Host', 'kategori' => 'Notifikasi', 'nilai' => 'smtp.gmail.com', 'tipe' => 'text', 'deskripsi' => 'Host SMTP.'],
            ['kode' => 'notification.smtp_port', 'nama' => 'SMTP Port', 'kategori' => 'Notifikasi', 'nilai' => '587', 'tipe' => 'number', 'deskripsi' => 'Port SMTP.'],
            ['kode' => 'notification.smtp_user', 'nama' => 'SMTP User', 'kategori' => 'Notifikasi', 'nilai' => 'noreply@niceon.id', 'tipe' => 'text', 'deskripsi' => 'Username SMTP.'],
            ['kode' => 'notification.smtp_password', 'nama' => 'SMTP Password', 'kategori' => 'Notifikasi', 'nilai' => 'secret', 'tipe' => 'text', 'deskripsi' => 'Password SMTP.'],

            ['kode' => 'appearance.theme', 'nama' => 'Theme', 'kategori' => 'Tampilan', 'nilai' => 'light', 'tipe' => 'select', 'deskripsi' => 'Tema default aplikasi.'],
            ['kode' => 'appearance.primary_color', 'nama' => 'Primary Color', 'kategori' => 'Tampilan', 'nilai' => '#4a5cff', 'tipe' => 'text', 'deskripsi' => 'Warna utama aplikasi.'],
            ['kode' => 'appearance.logo', 'nama' => 'Logo', 'kategori' => 'Tampilan', 'nilai' => 'niceon.png', 'tipe' => 'text', 'deskripsi' => 'Logo utama aplikasi.'],
            ['kode' => 'appearance.footer_text', 'nama' => 'Footer Text', 'kategori' => 'Tampilan', 'nilai' => 'Nice On Learning Hub', 'tipe' => 'text', 'deskripsi' => 'Teks footer aplikasi.'],
            ['kode' => 'appearance.copyright', 'nama' => 'Copyright', 'kategori' => 'Tampilan', 'nilai' => '© 2026 NICE ON', 'tipe' => 'text', 'deskripsi' => 'Teks copyright.'],

            ['kode' => 'security.recaptcha', 'nama' => 'Google Recaptcha', 'kategori' => 'Keamanan', 'nilai' => '0', 'tipe' => 'boolean', 'deskripsi' => 'Aktifkan Google Recaptcha.'],
            ['kode' => 'security.jwt_expired', 'nama' => 'JWT Expired', 'kategori' => 'Keamanan', 'nilai' => '60', 'tipe' => 'number', 'deskripsi' => 'Masa berlaku JWT dalam menit.'],
            ['kode' => 'security.token_lifetime', 'nama' => 'Token Lifetime', 'kategori' => 'Keamanan', 'nilai' => '120', 'tipe' => 'number', 'deskripsi' => 'Masa hidup token aplikasi.'],
            ['kode' => 'security.api_rate_limit', 'nama' => 'API Rate Limit', 'kategori' => 'Keamanan', 'nilai' => '60', 'tipe' => 'number', 'deskripsi' => 'Batas request API per menit.'],
            ['kode' => 'security.password_min_length', 'nama' => 'Password Minimum Length', 'kategori' => 'Keamanan', 'nilai' => '8', 'tipe' => 'number', 'deskripsi' => 'Minimal panjang password.'],
            ['kode' => 'security.force_https', 'nama' => 'Force HTTPS', 'kategori' => 'Keamanan', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Paksa akses menggunakan HTTPS.'],

            ['kode' => 'learning.max_video_preview', 'nama' => 'Maksimal Video Preview', 'kategori' => 'Learning', 'nilai' => '10', 'tipe' => 'number', 'deskripsi' => 'Durasi preview video dalam menit.'],
            ['kode' => 'learning.max_material_download', 'nama' => 'Maksimal Download Materi', 'kategori' => 'Learning', 'nilai' => '20', 'tipe' => 'number', 'deskripsi' => 'Batas download materi per user.'],
            ['kode' => 'learning.progress_min_pass', 'nama' => 'Progress Minimal Lulus', 'kategori' => 'Learning', 'nilai' => '80', 'tipe' => 'number', 'deskripsi' => 'Persentase progres minimal lulus.'],
            ['kode' => 'learning.certificate_auto', 'nama' => 'Sertifikat Otomatis', 'kategori' => 'Learning', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Generate sertifikat otomatis.'],
            ['kode' => 'learning.auto_unlock_material', 'nama' => 'Auto Unlock Materi', 'kategori' => 'Learning', 'nilai' => '0', 'tipe' => 'boolean', 'deskripsi' => 'Buka materi otomatis berdasarkan progres.'],

            ['kode' => 'catcpns.twk_default', 'nama' => 'TWK Default', 'kategori' => 'CAT CPNS', 'nilai' => '30', 'tipe' => 'number', 'deskripsi' => 'Jumlah default soal TWK.'],
            ['kode' => 'catcpns.tiu_default', 'nama' => 'TIU Default', 'kategori' => 'CAT CPNS', 'nilai' => '35', 'tipe' => 'number', 'deskripsi' => 'Jumlah default soal TIU.'],
            ['kode' => 'catcpns.tkp_default', 'nama' => 'TKP Default', 'kategori' => 'CAT CPNS', 'nilai' => '45', 'tipe' => 'number', 'deskripsi' => 'Jumlah default soal TKP.'],
            ['kode' => 'catcpns.passing_grade_twk', 'nama' => 'Passing Grade TWK', 'kategori' => 'CAT CPNS', 'nilai' => '65', 'tipe' => 'number', 'deskripsi' => 'Batas lulus TWK.'],
            ['kode' => 'catcpns.passing_grade_tiu', 'nama' => 'Passing Grade TIU', 'kategori' => 'CAT CPNS', 'nilai' => '80', 'tipe' => 'number', 'deskripsi' => 'Batas lulus TIU.'],
            ['kode' => 'catcpns.passing_grade_tkp', 'nama' => 'Passing Grade TKP', 'kategori' => 'CAT CPNS', 'nilai' => '166', 'tipe' => 'number', 'deskripsi' => 'Batas lulus TKP.'],
            ['kode' => 'catcpns.max_package_question', 'nama' => 'Maksimal Paket Soal', 'kategori' => 'CAT CPNS', 'nilai' => '110', 'tipe' => 'number', 'deskripsi' => 'Batas maksimal jumlah soal per paket.'],
            ['kode' => 'catcpns.shuffle_question', 'nama' => 'Shuffle Question', 'kategori' => 'CAT CPNS', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Acak soal saat ujian CAT CPNS.'],
            ['kode' => 'catcpns.shuffle_option', 'nama' => 'Shuffle Option', 'kategori' => 'CAT CPNS', 'nilai' => '1', 'tipe' => 'boolean', 'deskripsi' => 'Acak opsi jawaban saat ujian CAT CPNS.'],
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
