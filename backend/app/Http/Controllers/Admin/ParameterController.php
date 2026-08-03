<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ParameterController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('tbl_parameter')) {
            return $this->tableMissingResponse();
        }

        $search = trim((string) $request->query('search', ''));
        $category = trim((string) $request->query('category', ''));
        $status = trim((string) $request->query('status', ''));

        $query = DB::table('tbl_parameter')
            ->orderBy('kategori')
            ->orderBy('nama')
            ->orderBy('pid');

        if ($search !== '') {
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('kode', 'like', "%{$search}%")
                    ->orWhere('nama', 'like', "%{$search}%")
                    ->orWhere('nilai', 'like', "%{$search}%")
                    ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        if ($category !== '' && strtoupper($category) !== 'SEMUA') {
            $query->whereRaw('UPPER(kategori) = ?', [strtoupper($category)]);
        }

        if ($status !== '' && strtoupper($status) !== 'SEMUA') {
            $query->whereRaw("UPPER(CASE WHEN is_active = 1 THEN 'AKTIF' ELSE 'NONAKTIF' END) = ?", [strtoupper($status)]);
        }

        $items = $query->get()->map(fn ($item) => $this->mapRow($item));

        $summary = [
            'total_parameter' => (int) DB::table('tbl_parameter')->count(),
            'parameter_aktif' => (int) DB::table('tbl_parameter')->where('is_active', 1)->count(),
            'parameter_nonaktif' => (int) DB::table('tbl_parameter')->where('is_active', 0)->count(),
        ];

        $categories = DB::table('tbl_parameter')
            ->select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori')
            ->filter()
            ->values();

        return response()->json([
            'message' => 'Data parameter berhasil dimuat.',
            'summary' => $summary,
            'categories' => $categories,
            'data' => $items,
        ]);
    }

    public function show($pid)
    {
        if (!Schema::hasTable('tbl_parameter')) {
            return response()->json([
                'message' => 'Tabel parameter belum tersedia. Jalankan migrasi database terlebih dahulu.',
            ], 503);
        }

        $item = DB::table('tbl_parameter')
            ->where('pid', $pid)
            ->first();

        if (!$item) {
            return response()->json([
                'message' => 'Parameter tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Parameter berhasil dimuat.',
            'data' => $this->mapRow($item),
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('tbl_parameter')) {
            return response()->json([
                'message' => 'Tabel parameter belum tersedia. Jalankan migrasi database terlebih dahulu.',
            ], 503);
        }

        $input = [
            'kode' => $request->input('kode'),
            'nama' => $request->input('nama'),
            'kategori' => $request->input('kategori'),
            'nilai' => $request->input('nilai'),
            'tipe' => $request->input('tipe', 'text'),
            'deskripsi' => $request->input('deskripsi'),
            'is_active' => $request->boolean('is_active', true),
        ];

        $validator = Validator::make($input, [
            'kode' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_.-]+$/', 'unique:tbl_parameter,kode'],
            'nama' => ['required', 'string', 'max:150'],
            'kategori' => ['required', 'string', 'max:100'],
            'nilai' => ['required', 'string', 'max:255'],
            'tipe' => ['required', 'in:text,number,boolean,select'],
            'deskripsi' => ['nullable', 'string', 'max:255'],
        ], [
            'kode.unique' => 'Kode parameter sudah digunakan.',
            'kode.regex' => 'Kode parameter hanya boleh berisi huruf, angka, titik, tanda hubung, dan underscore.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi parameter gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $parameterId = DB::table('tbl_parameter')->insertGetId([
            'kode' => $input['kode'],
            'nama' => $input['nama'],
            'kategori' => $input['kategori'],
            'nilai' => $input['nilai'],
            'tipe' => $input['tipe'],
            'deskripsi' => $input['deskripsi'] ?: null,
            'is_active' => $input['is_active'] ? 1 : 0,
            'created_at' => now(),
            'created_by' => null,
            'updated_at' => null,
            'updated_by' => null,
        ]);

        return response()->json([
            'message' => 'Parameter berhasil disimpan.',
            'data' => $this->mapRow(DB::table('tbl_parameter')->where('pid', $parameterId)->first()),
        ], 201);
    }

    public function update(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_parameter')) {
            return response()->json([
                'message' => 'Tabel parameter belum tersedia. Jalankan migrasi database terlebih dahulu.',
            ], 503);
        }

        $existing = DB::table('tbl_parameter')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'Parameter tidak ditemukan.',
            ], 404);
        }

        $input = [
            'kode' => $request->input('kode'),
            'nama' => $request->input('nama'),
            'kategori' => $request->input('kategori'),
            'nilai' => $request->input('nilai'),
            'tipe' => $request->input('tipe', 'text'),
            'deskripsi' => $request->input('deskripsi'),
            'is_active' => $request->boolean('is_active', true),
        ];

        $validator = Validator::make($input, [
            'kode' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_.-]+$/', 'unique:tbl_parameter,kode,'.$pid.',pid'],
            'nama' => ['required', 'string', 'max:150'],
            'kategori' => ['required', 'string', 'max:100'],
            'nilai' => ['required', 'string', 'max:255'],
            'tipe' => ['required', 'in:text,number,boolean,select'],
            'deskripsi' => ['nullable', 'string', 'max:255'],
        ], [
            'kode.unique' => 'Kode parameter sudah digunakan.',
            'kode.regex' => 'Kode parameter hanya boleh berisi huruf, angka, titik, tanda hubung, dan underscore.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi parameter gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::table('tbl_parameter')
            ->where('pid', $pid)
            ->update([
                'kode' => $input['kode'],
                'nama' => $input['nama'],
                'kategori' => $input['kategori'],
                'nilai' => $input['nilai'],
                'tipe' => $input['tipe'],
                'deskripsi' => $input['deskripsi'] ?: null,
                'is_active' => $input['is_active'] ? 1 : 0,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'Parameter berhasil diperbarui.',
            'data' => $this->mapRow(DB::table('tbl_parameter')->where('pid', $pid)->first()),
        ]);
    }

    private function mapRow(object $item): array
    {
        $tipe = (string) ($item->tipe ?? 'text');
        $kategori = (string) ($item->kategori ?? 'Lainnya');
        $nilai = (string) ($item->nilai ?? '');
        $nilaiDisplay = $nilai;

        if ($tipe === 'boolean') {
            $nilaiDisplay = filter_var($nilai, FILTER_VALIDATE_BOOL) ? 'Aktif' : 'Nonaktif';
        }

        return [
            'pid' => (int) $item->pid,
            'kode' => (string) $item->kode,
            'nama' => (string) $item->nama,
            'kategori' => $kategori,
            'nilai' => $nilai,
            'nilai_display' => $nilaiDisplay,
            'tipe' => $tipe,
            'deskripsi' => (string) ($item->deskripsi ?? ''),
            'status' => (int) ($item->is_active ?? 1) === 1 ? 'Aktif' : 'Nonaktif',
            'status_key' => (int) ($item->is_active ?? 1) === 1 ? 'active' : 'inactive',
            'updated_at' => $item->updated_at ?? $item->created_at ?? null,
        ];
    }

    private function tableMissingResponse()
    {
        return response()->json([
            'message' => 'Tabel parameter belum tersedia. Jalankan migrasi database terlebih dahulu.',
            'summary' => [
                'total_parameter' => 0,
                'parameter_aktif' => 0,
                'parameter_nonaktif' => 0,
            ],
            'categories' => [],
            'data' => [],
        ], 503);
    }
}
