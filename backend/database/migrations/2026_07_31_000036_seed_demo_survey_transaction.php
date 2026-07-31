<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const USER_EMAIL = 'demo.survey@niceon.id';
    private const PAKET_PID = 1;
    private const ORDER_ID = 'NICEON-DEMO-SURVEY-0001';

    /**
     * Gives the demo.survey@niceon.id account (2026_07_31_000035) one
     * completed purchase, so the Midtrans review team sees a populated
     * transaction history instead of an empty account. Inserted directly
     * as 'paid' — no real Midtrans API call is made, so it never touches
     * a live Midtrans sandbox/production account.
     */
    public function up(): void
    {
        $pidUser = DB::table('tbl_user')->where('email', self::USER_EMAIL)->value('pid');
        $paket = DB::table('tbl_paket')->where('pid', self::PAKET_PID)->first();

        if (!$pidUser || !$paket) {
            return;
        }

        $now = now();

        DB::table('tbl_transaksi')->updateOrInsert(
            ['midtrans_order_id' => self::ORDER_ID],
            [
                'pid_user' => $pidUser,
                'pid_paket' => $paket->pid,
                'status_transaksi' => 'paid',
                'gross_amount' => $paket->harga,
                'payment_type' => 'bank_transfer',
                'midtrans_transaction_status' => 'settlement',
                'paid_date' => $now,
                'raw_notification' => json_encode([
                    'order_id' => self::ORDER_ID,
                    'transaction_status' => 'settlement',
                    'payment_type' => 'bank_transfer',
                    'gross_amount' => number_format((float) $paket->harga, 2, '.', ''),
                    'note' => 'Synthetic demo data seeded for Midtrans review — no real payment was processed.',
                ]),
                'created_at' => $now,
                'created_by' => $pidUser,
                'updated_at' => $now,
                'updated_by' => null,
            ]
        );
    }

    public function down(): void
    {
        DB::table('tbl_transaksi')->where('midtrans_order_id', self::ORDER_ID)->delete();
    }
};
