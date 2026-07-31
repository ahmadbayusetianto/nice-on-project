<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    private const EMAIL = 'demo.survey@niceon.id';

    /**
     * One-off regular-user account for the Midtrans review team to log in
     * and see the site working, requested 2026-07-31. Password is committed
     * in plain sight here (bcrypt-hashed at insert time) because this is a
     * throwaway low-privilege demo account, not a real customer — rotate or
     * deactivate it via tbl_user.status once the review is done.
     */
    public function up(): void
    {
        DB::table('tbl_user')->updateOrInsert(
            ['email' => self::EMAIL],
            [
                'password' => Hash::make('Survey2026!'),
                'status' => 'active',
                'is_admin' => 0,
                'created_at' => now(),
                'created_by' => null,
            ]
        );

        $pidUser = DB::table('tbl_user')->where('email', self::EMAIL)->value('pid');

        DB::table('tbl_detail_user')->updateOrInsert(
            ['pid_user' => $pidUser],
            [
                'nama' => 'Demo Survey',
                'gender' => 'L',
                'nohp' => '081200000000',
                'alamat' => 'Jakarta, Indonesia',
                'refference' => 'Internal Demo',
                'created_at' => now(),
                'created_by' => null,
            ]
        );
    }

    public function down(): void
    {
        $pidUser = DB::table('tbl_user')->where('email', self::EMAIL)->value('pid');

        if ($pidUser) {
            DB::table('tbl_detail_user')->where('pid_user', $pidUser)->delete();
        }

        DB::table('tbl_user')->where('email', self::EMAIL)->delete();
    }
};
