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

    private function getTableEngine(string $table): ?string
    {
        if (!Schema::hasTable($table)) {
            return null;
        }

        $database = DB::connection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT ENGINE
             FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
             LIMIT 1',
            [$database, $table]
        );

        return $row?->ENGINE ? strtolower((string) $row->ENGINE) : null;
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        if (!Schema::hasTable($table)) {
            return false;
        }

        $database = DB::connection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT INDEX_NAME
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?
             LIMIT 1',
            [$database, $table, $indexName]
        );

        return $row !== null;
    }

    private function normalizeUserIdColumn(): void
    {
        $parentColumnType = $this->getColumnType('tbl_user', 'pid');

        if ($parentColumnType === null) {
            return;
        }

        if (str_contains($parentColumnType, 'bigint')) {
            DB::statement('ALTER TABLE `tbl_tryout_session` MODIFY `user_id` BIGINT UNSIGNED NULL');
            return;
        }

        if (str_contains($parentColumnType, 'int')) {
            DB::statement('ALTER TABLE `tbl_tryout_session` MODIFY `user_id` INT UNSIGNED NULL');
            return;
        }

        DB::statement('ALTER TABLE `tbl_tryout_session` MODIFY `user_id` BIGINT UNSIGNED NULL');
    }

    private function normalizeEngine(string $table): void
    {
        $engine = $this->getTableEngine($table);

        if ($engine === 'innodb') {
            return;
        }

        DB::statement(sprintf('ALTER TABLE `%s` ENGINE=InnoDB', $table));
    }

    private function ensureIndex(string $table, string $indexName, string $column): void
    {
        if ($this->hasIndex($table, $indexName)) {
            return;
        }

        DB::statement(sprintf('ALTER TABLE `%s` ADD INDEX `%s` (`%s`)', $table, $indexName, $column));
    }

    private function getUserIdForeignKeys(): array
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasColumn('tbl_tryout_session', 'user_id')) {
            return [];
        }

        $database = DB::connection()->getDatabaseName();

        return DB::select(
            'SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL',
            [$database, 'tbl_tryout_session', 'user_id']
        );
    }

    private function dropForeignKey(string $constraintName): void
    {
        try {
            Schema::table('tbl_tryout_session', function (Blueprint $table) use ($constraintName) {
                $table->dropForeign($constraintName);
            });
        } catch (\Throwable) {
            // Ignore missing or already-dropped constraints.
        }
    }

    private function addCorrectForeignKey(): void
    {
        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->foreign('user_id', 'fk_tbl_tryout_session_user_tbl_user')
                ->references('pid')
                ->on('tbl_user')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    private function cleanupOrphanSessions(): void
    {
        $orphanSessionIds = DB::table('tbl_tryout_session as s')
            ->leftJoin('tbl_user as u', 'u.pid', '=', 's.user_id')
            ->whereNotNull('s.user_id')
            ->whereNull('u.pid')
            ->pluck('s.id');

        if ($orphanSessionIds->isEmpty()) {
            return;
        }

        DB::table('tbl_answer_sheet')
            ->whereIn('ljk_id', $orphanSessionIds)
            ->delete();

        DB::table('tbl_tryout_session')
            ->whereIn('id', $orphanSessionIds)
            ->delete();
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasColumn('tbl_tryout_session', 'user_id')) {
            return;
        }

        $foreignKeys = $this->getUserIdForeignKeys();
        $hasCorrectForeignKey = false;

        foreach ($foreignKeys as $foreignKey) {
            $referencedTable = strtolower((string) ($foreignKey->REFERENCED_TABLE_NAME ?? ''));
            $referencedColumn = strtolower((string) ($foreignKey->REFERENCED_COLUMN_NAME ?? ''));

            if ($referencedTable === 'tbl_user' && $referencedColumn === 'pid') {
                $hasCorrectForeignKey = true;
                continue;
            }

            $this->dropForeignKey((string) $foreignKey->CONSTRAINT_NAME);
        }

        $this->normalizeEngine('tbl_user');
        $this->normalizeEngine('tbl_tryout_session');
        $this->normalizeUserIdColumn();
        $this->ensureIndex('tbl_user', 'idx_tbl_user_pid_fk', 'pid');
        $this->ensureIndex('tbl_tryout_session', 'idx_tbl_tryout_session_user_id_fk', 'user_id');
        $this->cleanupOrphanSessions();

        if (!$hasCorrectForeignKey) {
            $this->addCorrectForeignKey();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasColumn('tbl_tryout_session', 'user_id')) {
            return;
        }

        $foreignKeys = $this->getUserIdForeignKeys();
        $hasLegacyForeignKey = false;

        foreach ($foreignKeys as $foreignKey) {
            $referencedTable = strtolower((string) ($foreignKey->REFERENCED_TABLE_NAME ?? ''));
            $referencedColumn = strtolower((string) ($foreignKey->REFERENCED_COLUMN_NAME ?? ''));

            if ($referencedTable === 'users' && $referencedColumn === 'id') {
                $hasLegacyForeignKey = true;
                continue;
            }

            $this->dropForeignKey((string) $foreignKey->CONSTRAINT_NAME);
        }

        $this->normalizeEngine('users');
        $this->normalizeEngine('tbl_user');
        $this->normalizeEngine('tbl_tryout_session');
        $this->normalizeUserIdColumn();
        $this->ensureIndex('tbl_user', 'idx_tbl_user_pid_fk', 'pid');
        $this->ensureIndex('tbl_tryout_session', 'idx_tbl_tryout_session_user_id_fk', 'user_id');

        if (!$hasLegacyForeignKey && Schema::hasTable('users')) {
            Schema::table('tbl_tryout_session', function (Blueprint $table) {
                $table->foreign('user_id', 'tbl_ljk_user_id_foreign')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }
};
