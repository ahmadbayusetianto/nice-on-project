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
        if (!Schema::hasTable('tbl_user')) {
            Schema::create('tbl_user', function (Blueprint $table) {
                $table->id('pid');
                $table->string('email', 150)->unique();
                $table->string('password');
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->boolean('is_admin')->default(false);
                $table->dateTime('created_at')->useCurrent();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->dateTime('updated_at')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });
        }

        if (!Schema::hasTable('tbl_detail_user')) {
            Schema::create('tbl_detail_user', function (Blueprint $table) {
                $table->id('pid');
                $table->unsignedBigInteger('pid_user');
                $table->string('nama', 150);
                $table->string('ttl', 150)->nullable();
                $table->enum('gender', ['L', 'P'])->nullable();
                $table->string('nohp', 30)->nullable();
                $table->text('alamat')->nullable();
                $table->string('refference', 150)->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->dateTime('updated_at')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();

                $table->foreign('pid_user', 'fk_detail_user')
                    ->references('pid')
                    ->on('tbl_user')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }

        if (!Schema::hasTable('tbl_paket')) {
            Schema::create('tbl_paket', function (Blueprint $table) {
                $table->id('pid');
                $table->string('kategori', 100);
                $table->string('formasi', 100)->nullable();
                $table->string('jadwal', 150)->nullable();
                $table->string('nama_paket', 150);
                $table->decimal('harga', 15, 2)->default(0);
                $table->text('ket')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->dateTime('updated_at')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });
        }

        if (!Schema::hasTable('tbl_transaksi')) {
            Schema::create('tbl_transaksi', function (Blueprint $table) {
                $table->id('pid');
                $table->unsignedBigInteger('pid_user');
                $table->unsignedBigInteger('pid_paket');
                $table->enum('status_transaksi', ['pending', 'paid', 'cancelled'])->default('pending');
                $table->dateTime('paid_date')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->dateTime('updated_at')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();

                $table->foreign('pid_user', 'fk_transaksi_user')
                    ->references('pid')
                    ->on('tbl_user')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();

                $table->foreign('pid_paket', 'fk_transaksi_paket')
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
        Schema::dropIfExists('tbl_transaksi');
        Schema::dropIfExists('tbl_paket');
        Schema::dropIfExists('tbl_detail_user');
        Schema::dropIfExists('tbl_user');
    }
};
