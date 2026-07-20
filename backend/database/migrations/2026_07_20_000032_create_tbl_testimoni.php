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
        if (Schema::hasTable('tbl_testimoni')) {
            return;
        }

        Schema::create('tbl_testimoni', function (Blueprint $table) {
            $table->id('pid');
            $table->string('nama', 150);
            $table->string('jabatan', 150)->nullable();
            $table->text('isi');
            $table->unsignedTinyInteger('rating')->default(5);
            $table->string('foto', 255)->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->dateTime('updated_at')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->dateTime('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_testimoni');
    }
};
