<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemParameterService
{
    public function value(string $code, mixed $default = null): mixed
    {
        if (!Schema::hasTable('tbl_parameter')) {
            return $default;
        }

        $item = DB::table('tbl_parameter')
            ->where('kode', $code)
            ->where('is_active', 1)
            ->first();

        return $item ? $item->nilai : $default;
    }

    public function intValue(string $code, int $default): int
    {
        return (int) $this->value($code, $default);
    }

    public function boolValue(string $code, bool $default): bool
    {
        $value = $this->value($code, $default ? '1' : '0');

        return filter_var($value, FILTER_VALIDATE_BOOL);
    }
}
