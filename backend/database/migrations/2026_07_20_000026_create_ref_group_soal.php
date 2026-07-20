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
        if (!Schema::hasTable('ref_group_soal')) {
            Schema::create('ref_group_soal', function (Blueprint $table) {
                $table->id('pid');
                $table->string('nama_paket', 150);
                $table->string('tipe_soal', 50);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ref_group_soal');
    }
};
