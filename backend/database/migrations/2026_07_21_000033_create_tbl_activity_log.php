<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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

    private function hasForeignKey(string $table, string $column, string $referencedTable, string $referencedColumn): bool
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return false;
        }

        $database = DB::connection()->getDatabaseName();

        $rows = DB::select(
            'SELECT REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL',
            [$database, $table, $column]
        );

        foreach ($rows as $row) {
            if (
                strtolower((string) $row->REFERENCED_TABLE_NAME) === strtolower($referencedTable)
                && strtolower((string) $row->REFERENCED_COLUMN_NAME) === strtolower($referencedColumn)
            ) {
                return true;
            }
        }

        return false;
    }

    // Match the parent's actual signedness instead of assuming UNSIGNED — some
    // environments were seeded from a raw SQL dump where `tbl_user`.`pid` was
    // created as plain (signed) BIGINT, and a foreign key requires both sides
    // to match exactly or MySQL/MariaDB rejects it with errno 150.
    private function normalizePidUserColumn(): void
    {
        $parentColumnType = $this->getColumnType('tbl_user', 'pid');

        if ($parentColumnType === null) {
            return;
        }

        $suffix = str_contains($parentColumnType, 'unsigned') ? ' UNSIGNED' : '';

        DB::statement("ALTER TABLE `tbl_activity_log` MODIFY `pid_user` BIGINT{$suffix} NOT NULL");
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_activity_log')) {
            Schema::create('tbl_activity_log', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pid_user')->index();
                $table->string('type');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('icon')->nullable();
                $table->json('meta')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        $this->normalizePidUserColumn();

        if (!$this->hasForeignKey('tbl_activity_log', 'pid_user', 'tbl_user', 'pid')) {
            Schema::table('tbl_activity_log', function (Blueprint $table) {
                $table->foreign('pid_user')->references('pid')->on('tbl_user')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_activity_log');
    }
};
