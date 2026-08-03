<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PackageAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PackageController extends Controller
{
    public function publicIndex(Request $request)
    {
        $kategori = trim((string) $request->query('kategori', ''));
        $purchasedOnlyUserId = (int) $request->query('user_id', 0);

        $query = DB::table('tbl_paket')
            ->whereNull('deleted_at')
            ->select([
                'pid',
                'kategori',
                'formasi',
                'jadwal',
                'nama_paket',
                'harga',
                'ket',
                'created_at',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('pid');

        if ($kategori !== '' && strtoupper($kategori) !== 'ALL') {
            $query->whereRaw('UPPER(kategori) = ?', [strtoupper($kategori)]);
        }

        if ($purchasedOnlyUserId > 0) {
            $query->whereIn('pid', (new PackageAccessService())->userPurchasedPackageIds($purchasedOnlyUserId));
        }

        $packages = $query->get()->map(function ($item) {
            return [
                'pid' => (int) $item->pid,
                'kategori' => $item->kategori,
                'formasi' => $item->formasi,
                'jadwal' => $item->jadwal,
                'nama_paket' => $item->nama_paket,
                'harga' => (float) $item->harga,
                'ket' => $item->ket,
                'created_at' => $item->created_at,
            ];
        });

        return response()->json([
            'message' => 'Data paket berhasil dimuat.',
            'data' => $packages,
        ]);
    }

    public function index(Request $request)
    {
        $kategori = trim((string) $request->query('kategori', ''));

        $query = DB::table('tbl_paket as p')
            ->leftJoin('tbl_paket as b', 'p.bundling_id', '=', 'b.pid')
            ->whereNull('p.deleted_at')
            ->select([
                'p.pid',
                'p.kategori',
                'p.formasi',
                'p.jadwal',
                'p.nama_paket',
                'p.tipe_paket',
                'p.bundling_id',
                'b.nama_paket as bundling_nama',
                'p.harga',
                'p.ket',
                'p.created_at',
            ])
            ->orderByDesc('p.created_at')
            ->orderByDesc('p.pid');

        if ($kategori !== '' && strtoupper($kategori) !== 'ALL') {
            $query->whereRaw('UPPER(p.kategori) = ?', [strtoupper($kategori)]);
        }

        $packages = $query->get()->map(function ($item) {
            $title = $item->nama_paket ?: 'Paket Belajar';
            $program = $item->kategori ?: '-';
            $type = $item->formasi ?: ($item->jadwal ?: '-');
            $description = $item->ket ?: '-';
            $price = (float) $item->harga;

            return [
                'pid' => (int) $item->pid,
                'name' => $title,
                'desc' => $description,
                'thumb' => strtoupper(substr((string) $program, 0, 10)),
                'tone' => strtoupper((string) $program) === 'PPPK' ? 'blue' : 'red',
                'program' => $program,
                'type' => $type,
                'formasi' => $item->formasi ?: null,
                'typeClass' => strtoupper((string) $program) === 'PPPK' ? 'online' : 'tryout',
                'tipe_paket' => $item->tipe_paket ?: 'tunggal',
                'bundling_id' => $item->bundling_id !== null ? (int) $item->bundling_id : null,
                'bundling_nama' => $item->bundling_nama,
                'price' => 'Rp'.number_format($price, 0, ',', '.'),
                'discount' => '-',
                'finalPrice' => 'Rp'.number_format($price, 0, ',', '.'),
                'status' => 'Aktif',
                'statusClass' => 'aktif',
                'sold' => '-',
            ];
        });

        $summary = [
            'total_paket' => (int) DB::table('tbl_paket')->whereNull('deleted_at')->count(),
            'paket_aktif' => (int) DB::table('tbl_paket')->whereNull('deleted_at')->count(),
            'paket_nonaktif' => (int) DB::table('tbl_paket')->whereNotNull('deleted_at')->count(),
            'total_penjualan' => (float) DB::table('tbl_paket')->whereNull('deleted_at')->sum('harga'),
        ];

        return response()->json([
            'message' => 'Data paket admin berhasil dimuat.',
            'summary' => $summary,
            'data' => $packages,
        ]);
    }

    public function refPaket(Request $request)
    {
        $bundle = trim((string) $request->query('bundle', ''));
        $search = trim((string) $request->query('search', ''));
        $tipe = trim((string) $request->query('tipe', ''));
        $pid = $request->query('pid');

        $query = DB::table('ref_paket')->whereNull('deleted_at');

        // With no pid/bundle given, list everything (optionally narrowed by
        // search/tipe) — used by pickers that browse the whole table (e.g.
        // Sandbox Tryout) rather than ones scoped to a single bundle.
        if ($pid !== null && $pid !== '') {
            $query->where('pid', $pid);
        } elseif ($bundle !== '') {
            $query->where('nama_bundle', $bundle);
        }

        if ($search !== '') {
            $query->where('nama_paket', 'like', "%{$search}%");
        }

        if ($tipe !== '') {
            $query->where('tipe', $tipe);
        }

        $rows = $query->orderBy('nama_paket')->get()->map(fn ($row) => [
            'pid' => (int) $row->pid,
            'name' => $row->nama_paket,
            'program' => $row->tipe,
            'type' => $row->nama_bundle,
        ])->values();

        return response()->json([
            'message' => 'Paket referensi berhasil dimuat.',
            'data' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $request->merge(['tipe_paket' => $request->input('tipe_paket') ?: 'tunggal']);

        $validator = Validator::make($request->all(), [
            'kategori' => ['required', 'string', 'max:100'],
            'formasi' => ['nullable', 'string', 'max:100'],
            'jadwal' => ['nullable', 'string', 'max:150'],
            'nama_paket' => ['required', 'string', 'max:150'],
            'tipe_paket' => ['required', 'in:tunggal,bundling'],
            'bundling_id' => [
                'nullable',
                'integer',
                Rule::exists('tbl_paket', 'pid')->where('tipe_paket', 'bundling')->whereNull('deleted_at'),
            ],
            'harga' => ['required', 'numeric', 'min:0'],
            'ket' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi paket gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $tipePaket = $validated['tipe_paket'] ?? 'tunggal';
        $now = now();

        $pid = DB::table('tbl_paket')->insertGetId([
            'kategori' => $validated['kategori'],
            'formasi' => $validated['formasi'] ?? null,
            'jadwal' => $validated['jadwal'] ?? null,
            'nama_paket' => $validated['nama_paket'],
            'tipe_paket' => $tipePaket,
            'bundling_id' => $tipePaket === 'tunggal' ? ($validated['bundling_id'] ?? null) : null,
            'harga' => $validated['harga'],
            'ket' => $validated['ket'] ?? null,
            'created_at' => $now,
            'created_by' => $request->user()->pid ?? null,
            'updated_at' => null,
            'updated_by' => null,
        ]);

        return response()->json([
            'message' => 'Paket berhasil ditambahkan.',
            'data' => DB::table('tbl_paket')
                ->where('pid', $pid)
                ->first(),
        ], 201);
    }

    public function show($pid)
    {
        $package = DB::table('tbl_paket as p')
            ->leftJoin('tbl_paket as b', 'p.bundling_id', '=', 'b.pid')
            ->select([
                'p.pid',
                'p.kategori',
                'p.formasi',
                'p.jadwal',
                'p.nama_paket',
                'p.tipe_paket',
                'p.bundling_id',
                'b.nama_paket as bundling_nama',
                'p.harga',
                'p.ket',
                'p.created_at',
                'p.created_by',
                'p.updated_at',
                'p.updated_by',
            ])
            ->where('p.pid', $pid)
            ->first();

        if (!$package) {
            return response()->json([
                'message' => 'Paket tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail paket berhasil dimuat.',
            'data' => [
                'pid' => (int) $package->pid,
                'kategori' => $package->kategori,
                'formasi' => $package->formasi,
                'jadwal' => $package->jadwal,
                'nama_paket' => $package->nama_paket,
                'tipe_paket' => $package->tipe_paket ?: 'tunggal',
                'bundling_id' => $package->bundling_id !== null ? (int) $package->bundling_id : null,
                'bundling_nama' => $package->bundling_nama,
                'harga' => (float) $package->harga,
                'ket' => $package->ket,
                'created_at' => $package->created_at,
                'created_by' => $package->created_by,
                'updated_at' => $package->updated_at,
                'updated_by' => $package->updated_by,
            ],
        ]);
    }

    public function update(Request $request, $pid)
    {
        $request->merge(['tipe_paket' => $request->input('tipe_paket') ?: 'tunggal']);

        $validator = Validator::make($request->all(), [
            'kategori' => ['required', 'string', 'max:100'],
            'formasi' => ['nullable', 'string', 'max:100'],
            'jadwal' => ['nullable', 'string', 'max:150'],
            'nama_paket' => ['required', 'string', 'max:150'],
            'tipe_paket' => ['required', 'in:tunggal,bundling'],
            'bundling_id' => [
                'nullable',
                'integer',
                Rule::exists('tbl_paket', 'pid')->where('tipe_paket', 'bundling')->whereNull('deleted_at'),
            ],
            'harga' => ['required', 'numeric', 'min:0'],
            'ket' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi paket gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $existingPackage = DB::table('tbl_paket')->where('pid', $pid)->first();

        if (!$existingPackage) {
            return response()->json([
                'message' => 'Paket tidak ditemukan.',
            ], 404);
        }

        $validated = $validator->validated();
        $tipePaket = $validated['tipe_paket'] ?? 'tunggal';

        if ($tipePaket === 'tunggal' && (int) ($validated['bundling_id'] ?? 0) === (int) $pid) {
            return response()->json([
                'message' => 'Validasi paket gagal.',
                'errors' => ['bundling_id' => ['Paket tidak bisa menjadi bundling untuk dirinya sendiri.']],
            ], 422);
        }

        if ($existingPackage->tipe_paket === 'bundling' && $tipePaket === 'tunggal') {
            $hasChildren = DB::table('tbl_paket')->where('bundling_id', $pid)->whereNull('deleted_at')->exists();

            if ($hasChildren) {
                return response()->json([
                    'message' => 'Validasi paket gagal.',
                    'errors' => ['tipe_paket' => ['Paket ini masih menjadi Bundling Paket untuk paket lain. Pindahkan atau hapus paket-paket tersebut terlebih dahulu.']],
                ], 422);
            }
        }

        DB::table('tbl_paket')
            ->where('pid', $pid)
            ->update([
                'kategori' => $validated['kategori'],
                'formasi' => $validated['formasi'] ?? null,
                'jadwal' => $validated['jadwal'] ?? null,
                'nama_paket' => $validated['nama_paket'],
                'tipe_paket' => $tipePaket,
                'bundling_id' => $tipePaket === 'tunggal' ? ($validated['bundling_id'] ?? null) : null,
                'harga' => $validated['harga'],
                'ket' => $validated['ket'] ?? null,
                'updated_at' => now(),
                'updated_by' => $request->user()->pid ?? null,
            ]);

        return response()->json([
            'message' => 'Paket berhasil diperbarui.',
            'data' => DB::table('tbl_paket')
                ->where('pid', $pid)
                ->first(),
        ]);
    }

    public function destroy(Request $request, $pid)
    {
        $existingPackage = DB::table('tbl_paket')
            ->where('pid', $pid)
            ->whereNull('deleted_at')
            ->first();

        if (!$existingPackage) {
            return response()->json([
                'message' => 'Paket tidak ditemukan.',
            ], 404);
        }

        if ($existingPackage->tipe_paket === 'bundling') {
            $hasChildren = DB::table('tbl_paket')->where('bundling_id', $pid)->whereNull('deleted_at')->exists();

            if ($hasChildren) {
                return response()->json([
                    'message' => 'Bundling Paket ini masih memiliki paket tunggal di dalamnya. Pindahkan atau hapus paket-paket tersebut terlebih dahulu.',
                ], 422);
            }
        }

        DB::table('tbl_paket')
            ->where('pid', $pid)
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
                'updated_by' => $request->user()->pid ?? null,
            ]);

        return response()->json([
            'message' => 'Paket berhasil dihapus.',
        ]);
    }
}
