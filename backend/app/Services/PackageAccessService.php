<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PackageAccessService
{
    public function userPurchasedPackageIds(?int $userId): array
    {
        if (!$userId || !Schema::hasTable('tbl_transaksi')) {
            return [];
        }

        return DB::table('tbl_transaksi')
            ->where('pid_user', $userId)
            ->where('status_transaksi', 'paid')
            ->pluck('pid_paket')
            ->filter()
            ->map(fn ($packageId) => (int) $packageId)
            ->unique()
            ->values()
            ->all();
    }

    public function userHasMaterialAccess(?int $userId, int $packageId): bool
    {
        if (!$userId) {
            return false;
        }

        return in_array($packageId, $this->userPurchasedPackageIds($userId), true);
    }
}
