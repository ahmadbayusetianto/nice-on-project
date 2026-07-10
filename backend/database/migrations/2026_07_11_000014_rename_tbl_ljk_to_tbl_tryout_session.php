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
        if (Schema::hasTable('tbl_answer_sheet')) {
            Schema::table('tbl_answer_sheet', function (Blueprint $table) {
                $table->dropForeign(['ljk_id']);
            });
        }

        if (Schema::hasTable('tbl_ljk') && !Schema::hasTable('tbl_tryout_session')) {
            Schema::rename('tbl_ljk', 'tbl_tryout_session');
        }

        if (Schema::hasTable('tbl_answer_sheet')) {
            Schema::table('tbl_answer_sheet', function (Blueprint $table) {
                $table->foreign('ljk_id')
                    ->references('id')
                    ->on('tbl_tryout_session')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_answer_sheet')) {
            Schema::table('tbl_answer_sheet', function (Blueprint $table) {
                $table->dropForeign(['ljk_id']);
            });
        }

        if (Schema::hasTable('tbl_tryout_session') && !Schema::hasTable('tbl_ljk')) {
            Schema::rename('tbl_tryout_session', 'tbl_ljk');
        }

        if (Schema::hasTable('tbl_answer_sheet')) {
            Schema::table('tbl_answer_sheet', function (Blueprint $table) {
                $table->foreign('ljk_id')
                    ->references('id')
                    ->on('tbl_ljk')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }
};
