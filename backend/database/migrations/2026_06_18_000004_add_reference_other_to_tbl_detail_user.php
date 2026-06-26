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
        if (Schema::hasTable('tbl_detail_user') && !Schema::hasColumn('tbl_detail_user', 'reference_other')) {
            Schema::table('tbl_detail_user', function (Blueprint $table) {
                $table->string('reference_other', 150)->nullable()->after('refference');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_detail_user') && Schema::hasColumn('tbl_detail_user', 'reference_other')) {
            Schema::table('tbl_detail_user', function (Blueprint $table) {
                $table->dropColumn('reference_other');
            });
        }
    }
};
