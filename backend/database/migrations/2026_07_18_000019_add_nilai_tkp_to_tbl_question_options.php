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
        if (!Schema::hasTable('tbl_question_options') || Schema::hasColumn('tbl_question_options', 'nilai_tkp')) {
            return;
        }

        Schema::table('tbl_question_options', function (Blueprint $table) {
            $table->unsignedTinyInteger('nilai_tkp')->nullable()->after('answer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_question_options') || !Schema::hasColumn('tbl_question_options', 'nilai_tkp')) {
            return;
        }

        Schema::table('tbl_question_options', function (Blueprint $table) {
            $table->dropColumn('nilai_tkp');
        });
    }
};
