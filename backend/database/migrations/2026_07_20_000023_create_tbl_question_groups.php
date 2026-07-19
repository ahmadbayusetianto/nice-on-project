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
     *
     * SKD groups (TWK/TIU/TKP) are seeded here with explicit ids 1/2/3
     * because a lot of existing code (quota lookup, TKP scoring, nilai_tkp
     * validation) already hardcodes those numbers as SKD group identity.
     * Keeping the ids stable means none of that code needs to change.
     */
    public function up(): void
    {
        if (Schema::hasTable('tbl_question_groups')) {
            return;
        }

        Schema::create('tbl_question_groups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->string('question_type', 20);
            $table->string('name', 100);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_locked')->default(false);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable();
            $table->dateTime('deleted_at')->nullable()->index();

            $table->index(['package_id', 'question_type']);
        });

        if (Schema::hasTable('tbl_paket')) {
            $parentType = $this->getColumnType('tbl_paket', 'pid') ?? 'bigint unsigned';
            $sqlType = str_contains($parentType, 'bigint') ? 'BIGINT' : 'INT';
            $sqlType .= str_contains($parentType, 'unsigned') ? ' UNSIGNED' : '';

            DB::statement("ALTER TABLE `tbl_question_groups` MODIFY `package_id` {$sqlType} NULL");

            Schema::table('tbl_question_groups', function (Blueprint $table) {
                $table->foreign('package_id')
                    ->references('pid')
                    ->on('tbl_paket')
                    ->cascadeOnDelete();
            });
        }

        $now = now();

        DB::table('tbl_question_groups')->insertOrIgnore([
            ['id' => 1, 'package_id' => null, 'question_type' => 'SKD', 'name' => 'TWK', 'sort_order' => 1, 'is_locked' => true, 'created_at' => $now, 'updated_at' => null, 'deleted_at' => null],
            ['id' => 2, 'package_id' => null, 'question_type' => 'SKD', 'name' => 'TIU', 'sort_order' => 2, 'is_locked' => true, 'created_at' => $now, 'updated_at' => null, 'deleted_at' => null],
            ['id' => 3, 'package_id' => null, 'question_type' => 'SKD', 'name' => 'TKP', 'sort_order' => 3, 'is_locked' => true, 'created_at' => $now, 'updated_at' => null, 'deleted_at' => null],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_question_groups');
    }
};
