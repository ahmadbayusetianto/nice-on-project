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
        if (Schema::hasTable('tbl_faq') && !Schema::hasColumn('tbl_faq', 'deleted_at')) {
            Schema::table('tbl_faq', function (Blueprint $table) {
                $table->dateTime('deleted_at')->nullable()->after('updated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_faq') && Schema::hasColumn('tbl_faq', 'deleted_at')) {
            Schema::table('tbl_faq', function (Blueprint $table) {
                $table->dropColumn('deleted_at');
            });
        }
    }
};
