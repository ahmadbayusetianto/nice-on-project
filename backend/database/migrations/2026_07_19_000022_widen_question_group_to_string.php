<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * question_group used to be a fixed tinyint (1=TWK, 2=TIU, 3=TKP) because
     * only SKD had a group taxonomy. SKB groups are admin-defined free text
     * (they vary per instansi/formasi), so the column needs to hold text too.
     * SKD rows keep storing '1'/'2'/'3' — every reader still int-casts those.
     *
     * Raw ALTER is used instead of Blueprint::change() because this project
     * doesn't have doctrine/dbal installed.
     */
    public function up(): void
    {
        if (Schema::hasTable('tbl_questions') && Schema::hasColumn('tbl_questions', 'question_group')) {
            DB::statement("ALTER TABLE `tbl_questions` MODIFY `question_group` VARCHAR(100) NOT NULL DEFAULT '1'");
        }

        if (Schema::hasTable('tbl_answer_sheet') && Schema::hasColumn('tbl_answer_sheet', 'question_group')) {
            DB::statement("ALTER TABLE `tbl_answer_sheet` MODIFY `question_group` VARCHAR(100) NOT NULL DEFAULT '1'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_questions') && Schema::hasColumn('tbl_questions', 'question_group')) {
            DB::statement("ALTER TABLE `tbl_questions` MODIFY `question_group` TINYINT UNSIGNED NOT NULL DEFAULT 1");
        }

        if (Schema::hasTable('tbl_answer_sheet') && Schema::hasColumn('tbl_answer_sheet', 'question_group')) {
            DB::statement("ALTER TABLE `tbl_answer_sheet` MODIFY `question_group` TINYINT UNSIGNED NOT NULL DEFAULT 1");
        }
    }
};
