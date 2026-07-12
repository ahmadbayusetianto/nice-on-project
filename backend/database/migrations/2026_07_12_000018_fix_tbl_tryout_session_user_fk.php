<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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
