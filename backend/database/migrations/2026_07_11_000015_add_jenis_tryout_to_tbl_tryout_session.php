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
        if (!Schema::hasTable('tbl_tryout_session') || Schema::hasColumn('tbl_tryout_session', 'jenis_tryout')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->string('jenis_tryout', 10)->default('SKD')->after('package_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasColumn('tbl_tryout_session', 'jenis_tryout')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->dropColumn('jenis_tryout');
        });
    }
};
