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
        if (Schema::hasTable('tbl_questions') && !Schema::hasColumn('tbl_questions', 'pembahasan_image_path')) {
            Schema::table('tbl_questions', function (Blueprint $table) {
                $table->string('pembahasan_image_path', 255)->nullable()->after('pembahasan');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_questions') && Schema::hasColumn('tbl_questions', 'pembahasan_image_path')) {
            Schema::table('tbl_questions', function (Blueprint $table) {
                $table->dropColumn('pembahasan_image_path');
            });
        }
    }
};
