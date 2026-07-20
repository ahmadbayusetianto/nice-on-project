<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `tbl_question_groups.package_id` (used to scope SKB groups) is being
     * repurposed to mean `ref_paket.pid` instead of `tbl_paket.pid`, the same
     * as `tbl_questions.package_id`. Dropped to a plain FK-less integer for
     * the same reason — see 2026_07_20_000028_drop_paket_fk_from_tbl_questions.
     * The 3 seeded global SKD rows keep `package_id = null`, unaffected.
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
        if (!Schema::hasTable('tbl_question_groups') || !Schema::hasColumn('tbl_question_groups', 'package_id')) {
            return;
        }

        $constraintName = $this->foreignKeyExists('tbl_question_groups', 'package_id');

        if ($constraintName) {
            Schema::table('tbl_question_groups', function (Blueprint $table) use ($constraintName) {
                $table->dropForeign($constraintName);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('tbl_question_groups') || !Schema::hasTable('tbl_paket') || !Schema::hasColumn('tbl_question_groups', 'package_id')) {
            return;
        }

        if ($this->foreignKeyExists('tbl_question_groups', 'package_id')) {
            return;
        }

        Schema::table('tbl_question_groups', function (Blueprint $table) {
            $table->foreign('package_id')
                ->references('pid')
                ->on('tbl_paket')
                ->cascadeOnDelete();
        });
    }
};
