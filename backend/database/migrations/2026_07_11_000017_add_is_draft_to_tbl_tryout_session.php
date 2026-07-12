<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || Schema::hasColumn('tbl_tryout_session', 'is_draft')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->boolean('is_draft')->default(false)->index()->after('status');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('tbl_tryout_session') || !Schema::hasColumn('tbl_tryout_session', 'is_draft')) {
            return;
        }

        Schema::table('tbl_tryout_session', function (Blueprint $table) {
            $table->dropColumn('is_draft');
        });
    }
};
