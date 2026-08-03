<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class FaqController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $search = trim((string) $request->query('search', ''));
        $category = trim((string) $request->query('category', ''));
        $status = trim((string) $request->query('status', ''));

        $query = DB::table('tbl_faq')
            ->whereNull('deleted_at')
            ->orderBy('urutan')
            ->orderBy('kategori')
            ->orderBy('pid');

        if ($search !== '') {
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('pertanyaan', 'like', "%{$search}%")
                    ->orWhere('jawaban', 'like', "%{$search}%")
                    ->orWhere('kategori', 'like', "%{$search}%")
                    ->orWhere('ikon', 'like', "%{$search}%");
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
            'total_faq' => (int) DB::table('tbl_faq')->whereNull('deleted_at')->count(),
            'faq_aktif' => (int) DB::table('tbl_faq')->whereNull('deleted_at')->where('is_active', 1)->count(),
            'faq_nonaktif' => (int) DB::table('tbl_faq')->whereNull('deleted_at')->where('is_active', 0)->count(),
        ];

        $categories = DB::table('tbl_faq')
            ->select('kategori')
            ->whereNull('deleted_at')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori')
            ->filter()
            ->values();

        return response()->json([
            'message' => 'Data FAQ admin berhasil dimuat.',
            'summary' => $summary,
            'categories' => $categories,
            'data' => $items,
        ]);
    }

    public function show($pid)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $item = DB::table('tbl_faq')
            ->whereNull('deleted_at')
            ->where('pid', $pid)
            ->first();

        if (!$item) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'FAQ berhasil dimuat.',
            'data' => $this->mapRow($item),
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $input = [
            'kategori' => $request->input('kategori', 'Umum'),
            'pertanyaan' => $request->input('pertanyaan'),
            'jawaban' => $request->input('jawaban'),
            'ikon' => $request->input('ikon', '❓'),
            'urutan' => $request->input('urutan', 0),
            'is_active' => $request->boolean('is_active', true),
        ];

        $validator = Validator::make($input, [
            'kategori' => ['required', 'string', 'max:100'],
            'pertanyaan' => ['required', 'string', 'max:255'],
            'jawaban' => ['required', 'string'],
            'ikon' => ['nullable', 'string', 'max:50'],
            'urutan' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi FAQ gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $faqId = DB::table('tbl_faq')->insertGetId([
            'kategori' => $input['kategori'],
            'pertanyaan' => $input['pertanyaan'],
            'jawaban' => $input['jawaban'],
            'ikon' => $input['ikon'] ?: '❓',
            'urutan' => (int) $input['urutan'],
            'is_active' => $input['is_active'] ? 1 : 0,
            'created_at' => now(),
            'created_by' => null,
            'updated_at' => null,
            'updated_by' => null,
        ]);

        return response()->json([
            'message' => 'FAQ berhasil disimpan.',
            'data' => $this->mapRow(DB::table('tbl_faq')->where('pid', $faqId)->first()),
        ], 201);
    }

    public function update(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_faq')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        if (!is_null($existing->deleted_at ?? null)) {
            return response()->json([
                'message' => 'FAQ sudah dihapus. Pulihkan dulu sebelum mengubahnya.',
            ], 409);
        }

        $input = [
            'kategori' => $request->input('kategori', 'Umum'),
            'pertanyaan' => $request->input('pertanyaan'),
            'jawaban' => $request->input('jawaban'),
            'ikon' => $request->input('ikon', '❓'),
            'urutan' => $request->input('urutan', 0),
            'is_active' => $request->boolean('is_active', true),
        ];

        $validator = Validator::make($input, [
            'kategori' => ['required', 'string', 'max:100'],
            'pertanyaan' => ['required', 'string', 'max:255'],
            'jawaban' => ['required', 'string'],
            'ikon' => ['nullable', 'string', 'max:50'],
            'urutan' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi FAQ gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::table('tbl_faq')
            ->where('pid', $pid)
            ->update([
                'kategori' => $input['kategori'],
                'pertanyaan' => $input['pertanyaan'],
                'jawaban' => $input['jawaban'],
                'ikon' => $input['ikon'] ?: '❓',
                'urutan' => (int) $input['urutan'],
                'is_active' => $input['is_active'] ? 1 : 0,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'FAQ berhasil diperbarui.',
            'data' => $this->mapRow(DB::table('tbl_faq')->where('pid', $pid)->first()),
        ]);
    }

    public function destroy($pid)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_faq')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        DB::table('tbl_faq')
            ->where('pid', $pid)
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'FAQ berhasil dipindahkan ke trash.',
        ]);
    }

    public function restore($pid)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_faq')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        if (is_null($existing->deleted_at ?? null)) {
            return response()->json([
                'message' => 'FAQ belum dihapus.',
            ], 409);
        }

        DB::table('tbl_faq')
            ->where('pid', $pid)
            ->update([
                'deleted_at' => null,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'FAQ berhasil dipulihkan.',
            'data' => $this->mapRow(DB::table('tbl_faq')->where('pid', $pid)->first()),
        ]);
    }

    public function toggle($pid)
    {
        if (!Schema::hasTable('tbl_faq')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_faq')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        $nextState = (int) ($existing->is_active ?? 1) === 1 ? 0 : 1;

        if (!is_null($existing->deleted_at ?? null)) {
            return response()->json([
                'message' => 'FAQ sudah dihapus. Pulihkan dulu sebelum mengubah statusnya.',
            ], 409);
        }

        DB::table('tbl_faq')
            ->where('pid', $pid)
            ->update([
                'is_active' => $nextState,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'Status FAQ berhasil diperbarui.',
            'data' => $this->mapRow(DB::table('tbl_faq')->where('pid', $pid)->first()),
        ]);
    }

    public function publicIndex()
    {
        $faqs = DB::table('tbl_faq')
            ->select([
                'pid',
                'kategori',
                'pertanyaan',
                'jawaban',
                'ikon',
                'urutan',
                'is_active',
            ])
            ->whereNull('deleted_at')
            ->where('is_active', 1)
            ->orderBy('urutan')
            ->orderBy('pid')
            ->get()
            ->map(function ($item) {
                return [
                    'pid' => (int) $item->pid,
                    'kategori' => $item->kategori,
                    'pertanyaan' => $item->pertanyaan,
                    'jawaban' => $item->jawaban,
                    'ikon' => $item->ikon ?: '❓',
                    'urutan' => (int) $item->urutan,
                ];
            });

        return response()->json([
            'message' => 'Data FAQ berhasil dimuat.',
            'data' => $faqs,
        ]);
    }

    private function mapRow(object $item): array
    {
        $isActive = (int) ($item->is_active ?? 1) === 1;

        return [
            'pid' => (int) $item->pid,
            'kategori' => (string) ($item->kategori ?? 'Umum'),
            'pertanyaan' => (string) $item->pertanyaan,
            'jawaban' => (string) $item->jawaban,
            'ikon' => (string) ($item->ikon ?: '❓'),
            'urutan' => (int) ($item->urutan ?? 0),
            'status' => $isActive ? 'Aktif' : 'Nonaktif',
            'status_key' => $isActive ? 'active' : 'inactive',
            'updated_at' => $item->updated_at ?? $item->created_at ?? null,
        ];
    }

    private function tableMissingResponse()
    {
        return response()->json([
            'message' => 'Tabel FAQ belum tersedia. Jalankan migrasi database terlebih dahulu.',
            'summary' => [
                'total_faq' => 0,
                'faq_aktif' => 0,
                'faq_nonaktif' => 0,
            ],
            'categories' => [],
            'data' => [],
        ], 503);
    }
}
