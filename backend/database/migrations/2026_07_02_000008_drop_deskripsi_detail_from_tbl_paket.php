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
        if (Schema::hasColumn('tbl_paket', 'deskripsi_detail')) {
            Schema::table('tbl_paket', function (Blueprint $table) {
                $table->dropColumn('deskripsi_detail');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('tbl_paket', 'deskripsi_detail')) {
            Schema::table('tbl_paket', function (Blueprint $table) {
                $table->text('deskripsi_detail')->nullable()->after('ket');
            });
        }
    }
};
