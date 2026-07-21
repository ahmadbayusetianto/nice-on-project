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
        Schema::create('tbl_activity_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pid_user')->index();
            $table->string('type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('pid_user')->references('pid')->on('tbl_user')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_activity_log');
    }
};
