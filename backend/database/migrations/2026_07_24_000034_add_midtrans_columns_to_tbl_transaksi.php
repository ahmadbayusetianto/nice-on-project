<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_transaksi')) {
            return;
        }

        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (!Schema::hasColumn('tbl_transaksi', 'midtrans_order_id')) {
                $table->string('midtrans_order_id', 100)->nullable()->unique()->after('pid_paket');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'gross_amount')) {
                $table->decimal('gross_amount', 15, 2)->nullable()->after('midtrans_order_id');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'snap_token')) {
                $table->string('snap_token', 255)->nullable()->after('gross_amount');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'snap_redirect_url')) {
                $table->string('snap_redirect_url', 500)->nullable()->after('snap_token');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'payment_type')) {
                $table->string('payment_type', 50)->nullable()->after('snap_redirect_url');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'midtrans_transaction_status')) {
                $table->string('midtrans_transaction_status', 30)->nullable()->after('payment_type');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'expired_at')) {
                $table->dateTime('expired_at')->nullable()->after('midtrans_transaction_status');
            }
            if (!Schema::hasColumn('tbl_transaksi', 'raw_notification')) {
                $table->json('raw_notification')->nullable()->after('expired_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_transaksi')) {
            return;
        }

        Schema::table('tbl_transaksi', function (Blueprint $table) {
            foreach ([
                'midtrans_order_id',
                'gross_amount',
                'snap_token',
                'snap_redirect_url',
                'payment_type',
                'midtrans_transaction_status',
                'expired_at',
                'raw_notification',
            ] as $column) {
                if (Schema::hasColumn('tbl_transaksi', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
