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
        if (!Schema::hasTable('tbl_materi')) {
            Schema::create('tbl_materi', function (Blueprint $table) {
                $table->id('pid');
                $table->unsignedBigInteger('package_id');
                $table->string('judul', 200);
                $table->text('deskripsi')->nullable();
                $table->string('file_path', 255);
                $table->string('original_name', 255);
                $table->string('mime_type', 100)->default('application/pdf');
                $table->unsignedBigInteger('file_size')->default(0);
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_published')->default(true);
                $table->dateTime('created_at')->useCurrent();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->dateTime('updated_at')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->dateTime('deleted_at')->nullable();

                $table->foreign('package_id', 'fk_materi_paket')
                    ->references('pid')
                    ->on('tbl_paket')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_materi');
    }
};
