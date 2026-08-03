<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class TestimonialController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $query = DB::table('tbl_testimoni')
            ->whereNull('deleted_at')
            ->orderBy('urutan')
            ->orderBy('pid');

        if ($search !== '') {
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('nama', 'like', "%{$search}%")
                    ->orWhere('jabatan', 'like', "%{$search}%")
                    ->orWhere('isi', 'like', "%{$search}%");
            });
        }

        if ($status !== '' && strtoupper($status) !== 'SEMUA') {
            $query->whereRaw("UPPER(CASE WHEN is_active = 1 THEN 'AKTIF' ELSE 'NONAKTIF' END) = ?", [strtoupper($status)]);
        }

        $items = $query->get()->map(fn ($item) => $this->mapRow($item, $request));

        $summary = [
            'total_testimoni' => (int) DB::table('tbl_testimoni')->whereNull('deleted_at')->count(),
            'testimoni_aktif' => (int) DB::table('tbl_testimoni')->whereNull('deleted_at')->where('is_active', 1)->count(),
            'testimoni_nonaktif' => (int) DB::table('tbl_testimoni')->whereNull('deleted_at')->where('is_active', 0)->count(),
        ];

        return response()->json([
            'message' => 'Data testimoni admin berhasil dimuat.',
            'summary' => $summary,
            'data' => $items,
        ]);
    }

    public function show(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $item = DB::table('tbl_testimoni')
            ->whereNull('deleted_at')
            ->where('pid', $pid)
            ->first();

        if (!$item) {
            return response()->json([
                'message' => 'Testimoni tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Testimoni berhasil dimuat.',
            'data' => $this->mapRow($item, $request),
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $validator = Validator::make($request->all(), [
            'nama' => ['required', 'string', 'max:150'],
            'jabatan' => ['nullable', 'string', 'max:150'],
            'isi' => ['required', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'urutan' => ['nullable', 'integer', 'min:0'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()],
        ], [
            'nama.required' => 'Nama wajib diisi.',
            'isi.required' => 'Isi testimoni wajib diisi.',
            'rating.required' => 'Rating wajib diisi.',
            'rating.min' => 'Rating minimal 1.',
            'rating.max' => 'Rating maksimal 5.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi testimoni gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $fotoPath = $request->hasFile('foto') ? storeUploadedQuestionImage($request->file('foto'), 'testimoni') : null;
        $now = now();

        $testimoniId = DB::table('tbl_testimoni')->insertGetId([
            'nama' => $validated['nama'],
            'jabatan' => $validated['jabatan'] ?? null,
            'isi' => $validated['isi'],
            'rating' => (int) $validated['rating'],
            'foto' => $fotoPath,
            'urutan' => (int) ($validated['urutan'] ?? 0),
            'is_active' => $request->boolean('is_active', true) ? 1 : 0,
            'created_at' => $now,
            'created_by' => null,
            'updated_at' => null,
            'updated_by' => null,
        ]);

        return response()->json([
            'message' => 'Testimoni berhasil disimpan.',
            'data' => $this->mapRow(DB::table('tbl_testimoni')->where('pid', $testimoniId)->first(), $request),
        ], 201);
    }

    public function update(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_testimoni')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'Testimoni tidak ditemukan.',
            ], 404);
        }

        if (!is_null($existing->deleted_at ?? null)) {
            return response()->json([
                'message' => 'Testimoni sudah dihapus. Pulihkan dulu sebelum mengubahnya.',
            ], 409);
        }

        $validator = Validator::make($request->all(), [
            'nama' => ['required', 'string', 'max:150'],
            'jabatan' => ['nullable', 'string', 'max:150'],
            'isi' => ['required', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'urutan' => ['nullable', 'integer', 'min:0'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()],
            'existing_foto_path' => ['nullable', 'string'],
        ], [
            'nama.required' => 'Nama wajib diisi.',
            'isi.required' => 'Isi testimoni wajib diisi.',
            'rating.required' => 'Rating wajib diisi.',
            'rating.min' => 'Rating minimal 1.',
            'rating.max' => 'Rating maksimal 5.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi testimoni gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $fotoPath = $request->hasFile('foto')
            ? storeUploadedQuestionImage($request->file('foto'), 'testimoni')
            : ($validated['existing_foto_path'] ?? $existing->foto);

        DB::table('tbl_testimoni')
            ->where('pid', $pid)
            ->update([
                'nama' => $validated['nama'],
                'jabatan' => $validated['jabatan'] ?? null,
                'isi' => $validated['isi'],
                'rating' => (int) $validated['rating'],
                'foto' => $fotoPath,
                'urutan' => (int) ($validated['urutan'] ?? 0),
                'is_active' => $request->boolean('is_active', true) ? 1 : 0,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'Testimoni berhasil diperbarui.',
            'data' => $this->mapRow(DB::table('tbl_testimoni')->where('pid', $pid)->first(), $request),
        ]);
    }

    public function destroy($pid)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_testimoni')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'Testimoni tidak ditemukan.',
            ], 404);
        }

        DB::table('tbl_testimoni')
            ->where('pid', $pid)
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'Testimoni berhasil dipindahkan ke trash.',
        ]);
    }

    public function restore(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_testimoni')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'Testimoni tidak ditemukan.',
            ], 404);
        }

        if (is_null($existing->deleted_at ?? null)) {
            return response()->json([
                'message' => 'Testimoni belum dihapus.',
            ], 409);
        }

        DB::table('tbl_testimoni')
            ->where('pid', $pid)
            ->update([
                'deleted_at' => null,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'Testimoni berhasil dipulihkan.',
            'data' => $this->mapRow(DB::table('tbl_testimoni')->where('pid', $pid)->first(), $request),
        ]);
    }

    public function toggle(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return $this->tableMissingResponse();
        }

        $existing = DB::table('tbl_testimoni')->where('pid', $pid)->first();

        if (!$existing) {
            return response()->json([
                'message' => 'Testimoni tidak ditemukan.',
            ], 404);
        }

        if (!is_null($existing->deleted_at ?? null)) {
            return response()->json([
                'message' => 'Testimoni sudah dihapus. Pulihkan dulu sebelum mengubah statusnya.',
            ], 409);
        }

        $nextState = (int) ($existing->is_active ?? 1) === 1 ? 0 : 1;

        DB::table('tbl_testimoni')
            ->where('pid', $pid)
            ->update([
                'is_active' => $nextState,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        return response()->json([
            'message' => 'Status testimoni berhasil diperbarui.',
            'data' => $this->mapRow(DB::table('tbl_testimoni')->where('pid', $pid)->first(), $request),
        ]);
    }

    public function publicIndex(Request $request)
    {
        if (!Schema::hasTable('tbl_testimoni')) {
            return response()->json([
                'message' => 'Data testimoni berhasil dimuat.',
                'data' => [],
            ]);
        }

        $testimonials = DB::table('tbl_testimoni')
            ->whereNull('deleted_at')
            ->where('is_active', 1)
            ->orderBy('urutan')
            ->orderBy('pid')
            ->get()
            ->map(fn ($item) => $this->mapRow($item, $request));

        return response()->json([
            'message' => 'Data testimoni berhasil dimuat.',
            'data' => $testimonials,
        ]);
    }

    private function mapRow(object $item, ?Request $request = null): array
    {
        $isActive = (int) ($item->is_active ?? 1) === 1;

        return [
            'pid' => (int) $item->pid,
            'nama' => (string) $item->nama,
            'jabatan' => $item->jabatan ?: null,
            'isi' => (string) $item->isi,
            'rating' => (int) ($item->rating ?? 5),
            'foto' => $item->foto ?: null,
            'foto_url' => buildQuestionImageUrl($request, $item->foto ?? null),
            'urutan' => (int) ($item->urutan ?? 0),
            'status' => $isActive ? 'Aktif' : 'Nonaktif',
            'status_key' => $isActive ? 'active' : 'inactive',
            'updated_at' => $item->updated_at ?? $item->created_at ?? null,
        ];
    }

    private function tableMissingResponse()
    {
        return response()->json([
            'message' => 'Tabel testimoni belum tersedia. Jalankan migrasi database terlebih dahulu.',
            'summary' => [
                'total_testimoni' => 0,
                'testimoni_aktif' => 0,
                'testimoni_nonaktif' => 0,
            ],
            'data' => [],
        ], 503);
    }
}
