<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tbl_questions')) {
            Schema::create('tbl_questions', function (Blueprint $table) {
                $table->id();
                $table->longText('question');
                $table->string('question_type', 20)->default('single');
                $table->unsignedTinyInteger('question_group')->index();
                $table->boolean('istext')->default(true)->index();
                $table->text('information')->nullable();
                $table->text('pembahasan')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable();
                $table->dateTime('deleted_at')->nullable()->index();
            });
        }

        if (!Schema::hasTable('tbl_question_options')) {
            Schema::create('tbl_question_options', function (Blueprint $table) {
                $table->id();
                $table->foreignId('question_id')
                    ->constrained('tbl_questions')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                $table->longText('choise');
                $table->boolean('answer')->default(false);
                $table->boolean('istext')->default(true);
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable();
                $table->dateTime('deleted_at')->nullable()->index();
            });
        }

        if (!Schema::hasTable('tbl_ljk')) {
            Schema::create('tbl_ljk', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedInteger('skor_twk')->default(0);
                $table->unsignedInteger('skor_tiu')->default(0);
                $table->unsignedInteger('skor_tkp')->default(0);
                $table->unsignedInteger('skor_total')->default(0);
                $table->unsignedTinyInteger('status')->default(0)->index();
                $table->string('keterangan', 100)->nullable();
                $table->dateTime('finish_at')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable();

                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }

        if (!Schema::hasTable('tbl_answer_sheet')) {
            Schema::create('tbl_answer_sheet', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ljk_id')
                    ->constrained('tbl_ljk')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                $table->foreignId('question_id')
                    ->constrained('tbl_questions')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                $table->unsignedTinyInteger('question_group')->index();
                $table->foreignId('option_id')
                    ->nullable()
                    ->constrained('tbl_question_options')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                $table->foreignId('answer_id')
                    ->nullable()
                    ->constrained('tbl_question_options')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                $table->unsignedSmallInteger('value')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_answer_sheet');
        Schema::dropIfExists('tbl_ljk');
        Schema::dropIfExists('tbl_question_options');
        Schema::dropIfExists('tbl_questions');
    }
};
