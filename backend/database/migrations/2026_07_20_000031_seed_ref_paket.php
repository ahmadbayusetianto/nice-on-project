<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot of ref_paket as populated on local dev, so other environments
     * (staging, teammates, production) start with the same reference data.
     */
    private function rows(): array
    {
        return [
            ['pid' => 1, 'nama_bundle' => 'Bundling SKD 1-3', 'nama_paket' => 'Paket SKD 1', 'tipe' => 'SKD'],
            ['pid' => 2, 'nama_bundle' => 'Bundling SKD 1-3', 'nama_paket' => 'Paket SKD 2', 'tipe' => 'SKD'],
            ['pid' => 3, 'nama_bundle' => 'Bundling SKD 1-3', 'nama_paket' => 'Paket SKD 3', 'tipe' => 'SKD'],
            ['pid' => 4, 'nama_bundle' => 'Bundling SKD 4-6', 'nama_paket' => 'Paket SKD 4', 'tipe' => 'SKD'],
            ['pid' => 5, 'nama_bundle' => 'Bundling SKD 4-6', 'nama_paket' => 'Paket SKD 5', 'tipe' => 'SKD'],
            ['pid' => 6, 'nama_bundle' => 'Bundling SKD 4-6', 'nama_paket' => 'Paket SKD 6', 'tipe' => 'SKD'],
            ['pid' => 7, 'nama_bundle' => 'Bundling SKD 7-9', 'nama_paket' => 'Paket SKD 7', 'tipe' => 'SKD'],
            ['pid' => 8, 'nama_bundle' => 'Bundling SKD 7-9', 'nama_paket' => 'Paket SKD 8', 'tipe' => 'SKD'],
            ['pid' => 9, 'nama_bundle' => 'Bundling SKD 7-9', 'nama_paket' => 'Paket SKD 9', 'tipe' => 'SKD'],
            ['pid' => 10, 'nama_bundle' => 'Bundling SKD 10-12', 'nama_paket' => 'Paket SKD 10', 'tipe' => 'SKD'],
            ['pid' => 11, 'nama_bundle' => 'Bundling SKD 10-12', 'nama_paket' => 'Paket SKD 11', 'tipe' => 'SKD'],
            ['pid' => 12, 'nama_bundle' => 'Bundling SKD 10-12', 'nama_paket' => 'Paket SKD 12', 'tipe' => 'SKD'],
            ['pid' => 13, 'nama_bundle' => 'SKB CAT 1', 'nama_paket' => 'SKB CAT 1', 'tipe' => 'SKD'],
            ['pid' => 14, 'nama_bundle' => 'SKB CAT 2', 'nama_paket' => 'SKB CAT 2', 'tipe' => 'SKD'],
        ];
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('ref_paket')) {
            return;
        }

        DB::table('ref_paket')->insertOrIgnore(array_map(
            fn (array $row) => $row + ['deleted_at' => null],
            $this->rows()
        ));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('ref_paket')) {
            return;
        }

        DB::table('ref_paket')->whereIn('pid', array_column($this->rows(), 'pid'))->delete();
    }
};
