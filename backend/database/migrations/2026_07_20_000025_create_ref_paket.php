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
        if (!Schema::hasTable('ref_paket')) {
            Schema::create('ref_paket', function (Blueprint $table) {
                $table->id('pid');
                $table->string('nama_bundle', 150);
                $table->string('nama_paket', 150);
                $table->string('tipe', 50);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ref_paket');
    }
};
