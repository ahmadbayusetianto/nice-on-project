<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * SKD rows already store '1'/'2'/'3' as text (from the earlier widen-to-
     * string migration) which happen to be the exact ids seeded for
     * TWK/TIU/TKP in tbl_question_groups, so they need no remapping — only
     * SKB rows (free text) need a real group created and their value
     * repointed to its id, while the column is still text.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_questions') || !Schema::hasTable('tbl_question_groups')) {
            return;
        }

        $now = now();

        $skbPairs = DB::table('tbl_questions')
            ->select('package_id', 'question_group')
            ->whereRaw("UPPER(question_type) = 'SKB'")
            ->whereNotNull('question_group')
            ->distinct()
            ->get();

        foreach ($skbPairs as $pair) {
            $packageId = $pair->package_id;
            $name = trim((string) $pair->question_group);

            if ($packageId === null || $name === '') {
                continue;
            }

            $existingGroup = DB::table('tbl_question_groups')
                ->where('package_id', $packageId)
                ->where('question_type', 'SKB')
                ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->whereNull('deleted_at')
                ->first();

            $groupId = $existingGroup->id ?? DB::table('tbl_question_groups')->insertGetId([
                'package_id' => $packageId,
                'question_type' => 'SKB',
                'name' => $name,
                'sort_order' => 0,
                'is_locked' => false,
                'created_at' => $now,
                'updated_at' => null,
                'deleted_at' => null,
            ]);

            DB::table('tbl_questions')
                ->where('package_id', $packageId)
                ->whereRaw("UPPER(question_type) = 'SKB'")
                ->where('question_group', $pair->question_group)
                ->update(['question_group' => (string) $groupId]);
        }

        // tbl_answer_sheet.question_group is a denormalized snapshot copied
        // from the question at tryout-start time (see createTryoutSessionRecord
        // in routes/api.php) — resync it from the now-migrated question value
        // instead of re-deriving package scoping independently.
        if (Schema::hasTable('tbl_answer_sheet')) {
            DB::statement(
                'UPDATE tbl_answer_sheet a
                 JOIN tbl_questions q ON a.question_id = q.id
                 SET a.question_group = q.question_group'
            );
        }

        DB::statement('ALTER TABLE `tbl_questions` MODIFY `question_group` BIGINT UNSIGNED NOT NULL');
        Schema::table('tbl_questions', function (Blueprint $table) {
            $table->foreign('question_group', 'fk_questions_question_group')
                ->references('id')
                ->on('tbl_question_groups')
                ->restrictOnDelete();
        });

        if (Schema::hasTable('tbl_answer_sheet')) {
            DB::statement('ALTER TABLE `tbl_answer_sheet` MODIFY `question_group` BIGINT UNSIGNED NOT NULL');
            Schema::table('tbl_answer_sheet', function (Blueprint $table) {
                $table->foreign('question_group', 'fk_answer_sheet_question_group')
                    ->references('id')
                    ->on('tbl_question_groups')
                    ->restrictOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_questions')) {
            Schema::table('tbl_questions', function (Blueprint $table) {
                $table->dropForeign('fk_questions_question_group');
            });
            DB::statement("ALTER TABLE `tbl_questions` MODIFY `question_group` VARCHAR(100) NOT NULL DEFAULT '1'");
        }

        if (Schema::hasTable('tbl_answer_sheet')) {
            Schema::table('tbl_answer_sheet', function (Blueprint $table) {
                $table->dropForeign('fk_answer_sheet_question_group');
            });
            DB::statement("ALTER TABLE `tbl_answer_sheet` MODIFY `question_group` VARCHAR(100) NOT NULL DEFAULT '1'");
        }
    }
};
