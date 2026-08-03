<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\AdminActivityNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;

class AdminNotificationService
{
    public function resolveAdminUsers(): Collection
    {
        if (!Schema::hasTable('tbl_user')) {
            return collect();
        }

        return User::query()
            ->where('is_admin', 1)
            ->where('status', 'active')
            ->get();
    }

    public function notify(string $type, string $title, string $message, ?string $url = null, array $meta = [], ?array $actor = null): void
    {
        $adminUsers = $this->resolveAdminUsers();

        if ($adminUsers->isEmpty()) {
            return;
        }

        $payload = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'url' => $url,
            'icon' => $meta['icon'] ?? '🔔',
            'meta' => $meta,
            'actor' => $actor,
        ];

        Notification::send($adminUsers, new AdminActivityNotification($payload));
    }

    public function logUserActivity(int $pidUser, string $type, string $title, ?string $description = null, ?string $icon = null, array $meta = []): void
    {
        DB::table('tbl_activity_log')->insert([
            'pid_user' => $pidUser,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'icon' => $icon,
            'meta' => json_encode($meta),
            'created_at' => now(),
        ]);
    }
}
