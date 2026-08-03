<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));
        $program = trim((string) $request->query('program', ''));

        $query = DB::table('tbl_transaksi')
            ->leftJoin('tbl_user', 'tbl_transaksi.pid_user', '=', 'tbl_user.pid')
            ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
            ->leftJoin('tbl_paket', 'tbl_transaksi.pid_paket', '=', 'tbl_paket.pid')
            ->select([
                'tbl_transaksi.pid as pid',
                'tbl_transaksi.status_transaksi as status_transaksi',
                'tbl_transaksi.paid_date as paid_date',
                'tbl_transaksi.created_at as created_at',
                'tbl_user.pid as user_pid',
                'tbl_user.email as email',
                'tbl_detail_user.nama as nama',
                'tbl_detail_user.nohp as nohp',
                'tbl_paket.pid as paket_pid',
                'tbl_paket.kategori as kategori',
                'tbl_paket.nama_paket as nama_paket',
                'tbl_paket.formasi as formasi',
                'tbl_paket.harga as harga',
            ])
            ->orderByDesc('tbl_transaksi.created_at')
            ->orderByDesc('tbl_transaksi.pid');

        if ($search !== '') {
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('tbl_user.email', 'like', "%{$search}%")
                    ->orWhere('tbl_detail_user.nama', 'like', "%{$search}%")
                    ->orWhere('tbl_detail_user.nohp', 'like', "%{$search}%")
                    ->orWhere('tbl_paket.nama_paket', 'like', "%{$search}%")
                    ->orWhere('tbl_paket.kategori', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT('INV-', DATE_FORMAT(tbl_transaksi.created_at, '%Y%m%d'), '-', LPAD(tbl_transaksi.pid, 3, '0')) LIKE ?", ["%{$search}%"]);
            });
        }

        if ($status !== '' && strtoupper($status) !== 'ALL') {
            $query->whereRaw('UPPER(tbl_transaksi.status_transaksi) = ?', [strtoupper($status)]);
        }

        if ($program !== '' && strtoupper($program) !== 'ALL') {
            $query->whereRaw('UPPER(tbl_paket.kategori) = ?', [strtoupper($program)]);
        }

        $transactions = $query->get()->map(function ($item) {
            $displayName = $item->nama ?: Str::before($item->email, '@');
            $createdAt = $item->created_at ? date('j M Y, H:i', strtotime($item->created_at)) : '-';
            $paidDate = $item->paid_date ? date('j M Y, H:i', strtotime($item->paid_date)) : '-';
            $statusKey = (string) $item->status_transaksi;

            return [
                'pid' => (int) $item->pid,
                'invoice' => 'INV-'.date('Ymd', strtotime((string) $item->created_at)).'-'.str_pad((string) $item->pid, 3, '0', STR_PAD_LEFT),
                'customerName' => $displayName,
                'customerEmail' => $item->email,
                'customerPhone' => $item->nohp ?: '-',
                'packageName' => $item->nama_paket ?: 'Paket Belajar',
                'program' => $item->kategori ?: '-',
                'packageType' => $item->formasi ?: '-',
                'transactionDate' => $createdAt,
                'transactionDateRaw' => $item->created_at,
                'paidDate' => $paidDate,
                'paidDateRaw' => $item->paid_date,
                'total' => (float) $item->harga,
                'totalLabel' => 'Rp'.number_format((float) $item->harga, 0, ',', '.'),
                'status' => $statusKey === 'paid' ? 'Berhasil' : ($statusKey === 'pending' ? 'Menunggu' : 'Dibatalkan'),
                'statusClass' => $statusKey === 'paid' ? 'success' : ($statusKey === 'pending' ? 'pending' : 'cancelled'),
            ];
        });

        $totalTransaksi = (int) DB::table('tbl_transaksi')->count();
        $totalPendapatan = (float) DB::table('tbl_transaksi as t')
            ->leftJoin('tbl_paket as p', 't.pid_paket', '=', 'p.pid')
            ->where('t.status_transaksi', 'paid')
            ->sum('p.harga');

        $summary = [
            'total_transaksi' => $totalTransaksi,
            'total_pendapatan' => $totalPendapatan,
            'transaksi_berhasil' => (int) DB::table('tbl_transaksi')->where('status_transaksi', 'paid')->count(),
            'menunggu_pembayaran' => (int) DB::table('tbl_transaksi')->where('status_transaksi', 'pending')->count(),
            'dibatalkan' => (int) DB::table('tbl_transaksi')->where('status_transaksi', 'cancelled')->count(),
        ];

        return response()->json([
            'message' => 'Data transaksi admin berhasil dimuat.',
            'summary' => $summary,
            'data' => $transactions,
        ]);
    }
}
