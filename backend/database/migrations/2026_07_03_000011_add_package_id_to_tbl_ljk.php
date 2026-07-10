<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('tbl_tryout_session', 'package_id')) {
            $packagePidType = data_get(DB::selectOne(
                'SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
                ['tbl_paket', 'pid']
            ), 'COLUMN_TYPE');

            $useBigInteger = is_string($packagePidType) && str_contains(strtolower($packagePidType), 'bigint');

            Schema::table('tbl_tryout_session', function (Blueprint $table) use ($useBigInteger) {
                if ($useBigInteger) {
                    $table->unsignedBigInteger('package_id')->nullable()->after('user_id')->index();
                } else {
                    $table->unsignedInteger('package_id')->nullable()->after('user_id')->index();
                }
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
        if (Schema::hasColumn('tbl_tryout_session', 'package_id')) {
            Schema::table('tbl_tryout_session', function (Blueprint $table) {
                $table->dropForeign(['package_id']);
                $table->dropColumn('package_id');
            });
        }
    }
};
