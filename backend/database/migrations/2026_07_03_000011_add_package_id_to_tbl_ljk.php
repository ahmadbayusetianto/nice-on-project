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
        if (!Schema::hasColumn('tbl_ljk', 'package_id')) {
            Schema::table('tbl_ljk', function (Blueprint $table) {
                $table->unsignedBigInteger('package_id')->nullable()->after('user_id')->index();
                $table->foreign('package_id')
                    ->references('pid')
                    ->on('tbl_paket')
                    ->nullOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tbl_ljk', 'package_id')) {
            Schema::table('tbl_ljk', function (Blueprint $table) {
                $table->dropForeign(['package_id']);
                $table->dropColumn('package_id');
            });
        }
    }
};
