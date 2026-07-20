<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `tbl_tryout_session.package_id` needs to hold `ref_paket.pid` for
     * sandbox (is_draft) sessions started against the new ref_paket-backed
     * Sandbox Tryout picker, while older/real sessions keep meaning
     * `tbl_paket.pid`. Dropped to a plain FK-less integer for the same
     * reason as tbl_questions/tbl_question_groups — see
     * 2026_07_20_000028_drop_paket_fk_from_tbl_questions.
     */
    private function foreignKeyExists(string $table, string $column): ?string
    {
        $database = DB::connection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT CONSTRAINT_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL
             LIMIT 1',
            [$database, $table, $column]
        );

        return $row?->CONSTRAINT_NAME;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasColumn('tbl_tryout_session', 'package_id')) {
            return;
        }

        $constraintName = $this->foreignKeyExists('tbl_tryout_session', 'package_id');

        if ($constraintName) {
            Schema::table('tbl_tryout_session', function (Blueprint $table) use ($constraintName) {
                $table->dropForeign($constraintName);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasTable('tbl_paket') || !Schema::hasColumn('tbl_tryout_session', 'package_id')) {
            return;
        }

        if ($this->foreignKeyExists('tbl_tryout_session', 'package_id')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->foreign('package_id')
                ->references('pid')
                ->on('tbl_paket')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }
};
