<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Some environments were seeded from a raw SQL dump where `pid` primary
     * keys were created as plain (signed) BIGINT instead of Laravel's usual
     * unsigned BIGINT. A self-referencing foreign key requires both sides to
     * match exactly, so we detect the real column type instead of assuming.
     */
    private function getColumnType(string $table, string $column): ?string
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return null;
        }

        $database = DB::connection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT COLUMN_TYPE
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1',
            [$database, $table, $column]
        );

        return $row?->COLUMN_TYPE ? strtolower((string) $row->COLUMN_TYPE) : null;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_paket')) {
            return;
        }

        if (!Schema::hasColumn('tbl_paket', 'tipe_paket')) {
            Schema::table('tbl_paket', function (Blueprint $table) {
                $table->string('tipe_paket', 20)->default('tunggal')->after('nama_paket');
            });
        }

        if (!Schema::hasColumn('tbl_paket', 'bundling_id')) {
            $parentType = $this->getColumnType('tbl_paket', 'pid') ?? 'bigint unsigned';
            $sqlType = str_contains($parentType, 'bigint') ? 'BIGINT' : 'INT';
            $sqlType .= str_contains($parentType, 'unsigned') ? ' UNSIGNED' : '';

            DB::statement("ALTER TABLE `tbl_paket` ADD COLUMN `bundling_id` {$sqlType} NULL AFTER `tipe_paket`");

            Schema::table('tbl_paket', function (Blueprint $table) {
                $table->foreign('bundling_id')
                    ->references('pid')
                    ->on('tbl_paket')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_paket')) {
            return;
        }

        if (Schema::hasColumn('tbl_paket', 'bundling_id')) {
            Schema::table('tbl_paket', function (Blueprint $table) {
                $table->dropForeign(['bundling_id']);
                $table->dropColumn('bundling_id');
            });
        }

        if (Schema::hasColumn('tbl_paket', 'tipe_paket')) {
            Schema::table('tbl_paket', function (Blueprint $table) {
                $table->dropColumn('tipe_paket');
            });
        }
    }
};
