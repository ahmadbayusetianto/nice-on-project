<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('notifications')) {
            return $this->tableMissingResponse();
        }

        $adminUserId = (int) $request->query('admin_user_id', $request->user()?->pid ?? 0);
        $limit = max(1, min((int) $request->query('limit', 10), 50));

        if ($adminUserId <= 0) {
            return response()->json([
                'message' => 'ID admin wajib diisi.',
                'summary' => [
                    'total_notifications' => 0,
                    'unread_notifications' => 0,
                ],
                'data' => [],
            ], 422);
        }

        $admin = User::query()
            ->where('pid', $adminUserId)
            ->where('is_admin', 1)
            ->first();

        if (!$admin) {
            return response()->json([
                'message' => 'Admin tidak ditemukan.',
                'summary' => [
                    'total_notifications' => 0,
                    'unread_notifications' => 0,
                ],
                'data' => [],
            ], 404);
        }

        $notifications = $admin->notifications()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($notification) => $this->mapNotification($notification))
            ->values();

        return response()->json([
            'message' => 'Notifikasi admin berhasil dimuat.',
            'summary' => [
                'total_notifications' => (int) $admin->notifications()->count(),
                'unread_notifications' => (int) $admin->unreadNotifications()->count(),
            ],
            'data' => $notifications,
        ]);
    }

    public function unreadCount(Request $request)
    {
        if (!Schema::hasTable('notifications')) {
            return $this->tableMissingResponse();
        }

        $adminUserId = (int) $request->query('admin_user_id', $request->user()?->pid ?? 0);

        if ($adminUserId <= 0) {
            return response()->json(['message' => 'ID admin wajib diisi.', 'count' => 0], 422);
        }

        $admin = User::query()
            ->where('pid', $adminUserId)
            ->where('is_admin', 1)
            ->first();

        if (!$admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.', 'count' => 0], 404);
        }

        return response()->json([
            'message' => 'Jumlah notifikasi belum dibaca berhasil dimuat.',
            'count' => (int) $admin->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $notificationId)
    {
        if (!Schema::hasTable('notifications')) {
            return $this->tableMissingResponse();
        }

        $adminUserId = (int) $request->input('admin_user_id', $request->query('admin_user_id', $request->user()?->pid ?? 0));

        if ($adminUserId <= 0) {
            return response()->json(['message' => 'ID admin wajib diisi.'], 422);
        }

        $admin = User::query()
            ->where('pid', $adminUserId)
            ->where('is_admin', 1)
            ->first();

        if (!$admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        $notification = $admin->notifications()->where('id', $notificationId)->first();

        if (!$notification) {
            return response()->json(['message' => 'Notifikasi tidak ditemukan.'], 404);
        }

        if ($notification->read_at === null) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => 'Notifikasi berhasil ditandai sebagai dibaca.',
            'data' => $this->mapNotification($notification->fresh()),
        ]);
    }

    public function markAllRead(Request $request)
    {
        if (!Schema::hasTable('notifications')) {
            return $this->tableMissingResponse();
        }

        $adminUserId = (int) $request->input('admin_user_id', $request->query('admin_user_id', $request->user()?->pid ?? 0));

        if ($adminUserId <= 0) {
            return response()->json(['message' => 'ID admin wajib diisi.'], 422);
        }

        $admin = User::query()
            ->where('pid', $adminUserId)
            ->where('is_admin', 1)
            ->first();

        if (!$admin) {
            return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
        }

        $updated = $admin->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Semua notifikasi berhasil ditandai sebagai dibaca.',
            'updated' => (int) $updated,
        ]);
    }

    private function mapNotification(object $notification): array
    {
        $rawData = $notification->data ?? [];

        if (is_string($rawData)) {
            $data = json_decode($rawData, true) ?: [];
        } elseif (is_array($rawData)) {
            $data = $rawData;
        } elseif ($rawData instanceof \JsonSerializable) {
            $data = (array) $rawData->jsonSerialize();
        } else {
            $data = (array) $rawData;
        }

        return [
            'id' => (string) $notification->id,
            'type' => (string) ($data['type'] ?? $notification->type ?? 'activity'),
            'title' => (string) ($data['title'] ?? 'Notifikasi'),
            'message' => (string) ($data['message'] ?? ''),
            'icon' => (string) ($data['icon'] ?? '🔔'),
            'url' => $data['url'] ?? null,
            'meta' => $data['meta'] ?? [],
            'actor' => $data['actor'] ?? null,
            'read_at' => $notification->read_at ?? null,
            'is_read' => $notification->read_at !== null,
            'created_at' => $notification->created_at ?? null,
            'created_at_human' => !empty($notification->created_at) ? Carbon::parse($notification->created_at)->diffForHumans() : null,
        ];
    }

    private function tableMissingResponse()
    {
        return response()->json([
            'message' => 'Tabel notifications belum tersedia. Jalankan migrasi database terlebih dahulu.',
            'summary' => [
                'total_notifications' => 0,
                'unread_notifications' => 0,
            ],
            'data' => [],
        ], 503);
    }
}
