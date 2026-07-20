<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `tbl_questions.package_id` is being repurposed to mean `ref_paket.pid`
     * instead of `tbl_paket.pid`. `ref_paket` has no rows yet, so this column
     * intentionally goes back to being a plain, FK-less integer (matching how
     * `ref_paket`/`ref_group_soal` were designed with no foreign keys) rather
     * than pointing a hard DB constraint at a table it can't yet satisfy.
     * Existing question rows keep their old (now-stale) values untouched.
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
        if (!Schema::hasTable('tbl_questions') || !Schema::hasColumn('tbl_questions', 'package_id')) {
            return;
        }

        $constraintName = $this->foreignKeyExists('tbl_questions', 'package_id');

        if ($constraintName) {
            Schema::table('tbl_questions', function (Blueprint $table) use ($constraintName) {
                $table->dropForeign($constraintName);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_questions') || !Schema::hasTable('tbl_paket') || !Schema::hasColumn('tbl_questions', 'package_id')) {
            return;
        }

        if ($this->foreignKeyExists('tbl_questions', 'package_id')) {
            return;
        }

        Schema::table('tbl_questions', function (Blueprint $table) {
            $table->foreign('package_id')
                ->references('pid')
                ->on('tbl_paket')
                ->nullOnDelete();
        });
    }
};
