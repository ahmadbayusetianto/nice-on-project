<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UserStatsController extends Controller
{
    public function activityLog(Request $request, $pid)
    {
        $limit = (int) $request->query('limit', 10);
        $limit = max(1, min($limit, 50));

        $activities = DB::table('tbl_activity_log')
            ->where('pid_user', $pid)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => (int) $activity->id,
                    'type' => $activity->type,
                    'title' => $activity->title,
                    'description' => $activity->description,
                    'icon' => $activity->icon,
                    'meta' => $activity->meta ? json_decode($activity->meta, true) : [],
                    'created_at' => $activity->created_at,
                ];
            });

        return response()->json([
            'message' => 'Riwayat aktivitas berhasil dimuat.',
            'data' => $activities,
        ]);
    }

    public function learningStreak($pid)
    {
        $activityDates = DB::table('tbl_activity_log')
            ->where('pid_user', $pid)
            ->whereIn('type', ['tryout.started', 'tryout.finished', 'material.viewed'])
            ->selectRaw('DISTINCT DATE(created_at) as activity_date')
            ->orderByDesc('activity_date')
            ->pluck('activity_date')
            ->flip();

        // "Hari ini" belum tentu sudah ada aktivitas saat dicek (jam berapa pun user buka
        // dashboard) — mulai hitung dari kemarin kalau hari ini masih kosong, supaya streak
        // tidak nge-reset ke 0 hanya karena user belum sempat beraktivitas hari ini.
        $cursor = Carbon::today();
        if (!$activityDates->has($cursor->toDateString())) {
            $cursor = $cursor->subDay();
        }

        $streakDays = 0;
        while ($activityDates->has($cursor->toDateString())) {
            $streakDays++;
            $cursor = $cursor->subDay();
        }

        return response()->json([
            'message' => 'Streak belajar berhasil dihitung.',
            'data' => [
                'streak_days' => $streakDays,
            ],
        ]);
    }

    public function tryoutHistory($pid)
    {
        $hasDraftColumn = Schema::hasColumn('tbl_tryout_session', 'is_draft');

        $sessions = DB::table('tbl_tryout_session as l')
            ->leftJoin('tbl_paket as p', 'l.package_id', '=', 'p.pid')
            ->where('l.user_id', $pid)
            ->when($hasDraftColumn, function ($query) {
                $query->where(function ($draftQuery) {
                    $draftQuery->whereNull('l.is_draft')->orWhere('l.is_draft', 0);
                });
            })
            ->orderByDesc('l.created_at')
            ->select([
                'l.id',
                'l.package_id',
                'p.nama_paket',
                'l.keterangan',
                'l.jenis_tryout',
                'l.skor_total',
                'l.skor_twk',
                'l.skor_tiu',
                'l.skor_tkp',
                'l.status',
                'l.finish_at',
                'l.created_at',
            ])
            ->get()
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'package_id' => $row->package_id !== null ? (int) $row->package_id : null,
                    'nama_paket' => $row->nama_paket ?: ($row->keterangan ?: 'Paket tidak diketahui'),
                    'jenis_tryout' => $row->jenis_tryout,
                    'skor_total' => (int) $row->skor_total,
                    'skor_twk' => (int) $row->skor_twk,
                    'skor_tiu' => (int) $row->skor_tiu,
                    'skor_tkp' => (int) $row->skor_tkp,
                    'is_finished' => (int) $row->status === 1,
                    'finish_at' => $row->finish_at,
                    'created_at' => $row->created_at,
                ];
            });

        return response()->json([
            'message' => 'Riwayat tryout berhasil dimuat.',
            'data' => $sessions,
        ]);
    }

    public function activityCalendar(Request $request, $pid)
    {
        $month = (string) $request->query('month', now()->format('Y-m'));

        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            return response()->json([
                'message' => 'Format bulan tidak valid, gunakan YYYY-MM.',
            ], 422);
        }

        try {
            $startDate = Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfDay();
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Format bulan tidak valid, gunakan YYYY-MM.',
            ], 422);
        }

        $endDate = $startDate->copy()->endOfMonth();

        $counts = DB::table('tbl_activity_log')
            ->where('pid_user', $pid)
            ->whereIn('type', ['tryout.started', 'tryout.finished', 'material.viewed'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as activity_date, COUNT(*) as cnt')
            ->groupBy('activity_date')
            ->pluck('cnt', 'activity_date');

        $days = [];
        for ($cursor = $startDate->copy(); $cursor->lte($endDate); $cursor->addDay()) {
            $dateKey = $cursor->toDateString();
            $days[] = [
                'date' => $dateKey,
                'count' => (int) ($counts[$dateKey] ?? 0),
            ];
        }

        return response()->json([
            'message' => 'Kalender aktivitas berhasil dimuat.',
            'data' => [
                'month' => $startDate->format('Y-m'),
                'days' => $days,
            ],
        ]);
    }

    public function transactions($pid)
    {
        $transactions = DB::table('tbl_transaksi')
            ->leftJoin('tbl_paket', 'tbl_transaksi.pid_paket', '=', 'tbl_paket.pid')
            ->where('tbl_transaksi.pid_user', $pid)
            ->orderByDesc('tbl_transaksi.created_at')
            ->orderByDesc('tbl_transaksi.pid')
            ->select([
                'tbl_transaksi.pid as pid',
                'tbl_transaksi.status_transaksi as status_transaksi',
                'tbl_transaksi.paid_date as paid_date',
                'tbl_transaksi.payment_type as payment_type',
                'tbl_transaksi.created_at as created_at',
                'tbl_paket.nama_paket as nama_paket',
                'tbl_paket.kategori as kategori',
                'tbl_paket.harga as harga',
            ])
            ->get()
            ->map(function ($item) {
                $statusKey = (string) $item->status_transaksi;

                return [
                    'pid' => (int) $item->pid,
                    'invoice' => 'INV-'.date('Ymd', strtotime((string) $item->created_at)).'-'.str_pad((string) $item->pid, 3, '0', STR_PAD_LEFT),
                    'nama_paket' => $item->nama_paket ?: 'Paket Belajar',
                    'kategori' => $item->kategori ?: '-',
                    'total' => (float) $item->harga,
                    'payment_type' => $item->payment_type,
                    'created_at' => $item->created_at,
                    'paid_date' => $item->paid_date,
                    'status' => $statusKey === 'paid' ? 'Berhasil' : ($statusKey === 'pending' ? 'Menunggu' : 'Dibatalkan'),
                    'status_class' => $statusKey === 'paid' ? 'success' : ($statusKey === 'pending' ? 'pending' : 'cancelled'),
                ];
            });

        return response()->json([
            'message' => 'Riwayat transaksi berhasil dimuat.',
            'data' => $transactions,
        ]);
    }
}
