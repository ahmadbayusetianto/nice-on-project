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
        if (!Schema::hasTable('tbl_parameter')) {
            Schema::create('tbl_parameter', function (Blueprint $table) {
                $table->id('pid');
                $table->string('kode', 100)->unique();
                $table->string('nama', 150);
                $table->string('kategori', 100);
                $table->string('nilai', 255);
                $table->enum('tipe', ['text', 'number', 'boolean', 'select'])->default('text');
                $table->string('deskripsi', 255)->nullable();
                $table->boolean('is_active')->default(true);
                $table->dateTime('created_at')->useCurrent();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->dateTime('updated_at')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_parameter');
    }
};
