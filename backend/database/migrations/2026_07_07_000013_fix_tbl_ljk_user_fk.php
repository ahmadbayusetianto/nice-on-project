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
        if (!Schema::hasTable('tbl_tryout_session')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->dropForeign('tbl_tryout_session_user_id_foreign');
        });

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->foreign('user_id', 'fk_tbl_tryout_session_user_tbl_user')
                ->references('pid')
                ->on('tbl_user')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_tryout_session')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->dropForeign('fk_tbl_tryout_session_user_tbl_user');
        });

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->foreign('user_id', 'tbl_tryout_session_user_id_foreign')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }
};
