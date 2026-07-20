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
        if (Schema::hasTable('ref_paket') && !Schema::hasColumn('ref_paket', 'deleted_at')) {
            Schema::table('ref_paket', function (Blueprint $table) {
                $table->dateTime('deleted_at')->nullable()->after('tipe');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ref_paket') && Schema::hasColumn('ref_paket', 'deleted_at')) {
            Schema::table('ref_paket', function (Blueprint $table) {
                $table->dropColumn('deleted_at');
            });
        }
    }
};
