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
     * unsigned BIGINT. A foreign key requires both sides to match exactly,
     * so we detect the parent's real type instead of assuming unsigned.
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
        if (!Schema::hasTable('tbl_questions') || !Schema::hasTable('tbl_paket')) {
            return;
        }

        if (!Schema::hasColumn('tbl_questions', 'package_id')) {
            $parentType = $this->getColumnType('tbl_paket', 'pid') ?? 'bigint unsigned';
            $sqlType = str_contains($parentType, 'bigint') ? 'BIGINT' : 'INT';
            $sqlType .= str_contains($parentType, 'unsigned') ? ' UNSIGNED' : '';

            DB::statement("ALTER TABLE `tbl_questions` ADD COLUMN `package_id` {$sqlType} NULL AFTER `question_group`");

            Schema::table('tbl_questions', function (Blueprint $table) {
                $table->foreign('package_id')
                    ->references('pid')
                    ->on('tbl_paket')
                    ->nullOnDelete();
            });
        }

        // Backfill existing questions (created before this column existed) with a
        // random package so they remain selectable once tryout selection starts
        // filtering questions by package_id.
        $packageIds = DB::table('tbl_paket')->whereNull('deleted_at')->pluck('pid')->all();

        if (empty($packageIds)) {
            return;
        }

        DB::table('tbl_questions')
            ->whereNull('package_id')
            ->orderBy('id')
            ->pluck('id')
            ->each(function ($questionId) use ($packageIds) {
                DB::table('tbl_questions')
                    ->where('id', $questionId)
                    ->update(['package_id' => $packageIds[array_rand($packageIds)]]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_questions') || !Schema::hasColumn('tbl_questions', 'package_id')) {
            return;
        }

        Schema::table('tbl_questions', function (Blueprint $table) {
            $table->dropForeign(['package_id']);
            $table->dropColumn('package_id');
        });
    }
};
