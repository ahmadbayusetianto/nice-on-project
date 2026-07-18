<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_questions') || !Schema::hasTable('tbl_paket')) {
            return;
        }

        if (!Schema::hasColumn('tbl_questions', 'package_id')) {
            Schema::table('tbl_questions', function (Blueprint $table) {
                $table->unsignedBigInteger('package_id')->nullable()->after('question_group');
            });

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
