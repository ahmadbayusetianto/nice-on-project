<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

function formatReferenceDisplay(?string $reference, ?string $referenceOther = null): string
{
    $reference = trim((string) $reference);
    $referenceOther = trim((string) $referenceOther);

    if ($reference === '') {
        return 'Belum diisi';
    }

    if ($reference === 'Lainnya' && $referenceOther !== '') {
        return 'Lainnya: ' . $referenceOther;
    }

    return $reference;
}

function mapParameterRow(object $item): array
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

function parameterTableMissingResponse()
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

function mapFaqRow(object $item): array
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

function faqTableMissingResponse()
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

function questionGroupLabel(int $group): string
{
    return match ($group) {
        1 => 'TWK',
        2 => 'TIU',
        3 => 'TKP',
        default => 'Unknown',
    };
}

function mapQuestionOptionRow(object $item): array
{
    return [
        'id' => (int) $item->id,
        'question_id' => (int) $item->question_id,
        'choise' => (string) $item->choise,
        'answer' => (int) ($item->answer ?? 0) === 1,
        'istext' => (int) ($item->istext ?? 1) === 1,
        'deleted_at' => $item->deleted_at ?? null,
    ];
}

function mapQuestionRow(object $item, ?array $options = null): array
{
    $group = (int) ($item->question_group ?? 1);

    return [
        'id' => (int) $item->id,
        'question' => (string) $item->question,
        'question_type' => (string) ($item->question_type ?? 'single'),
        'question_group' => $group,
        'question_group_label' => questionGroupLabel($group),
        'istext' => (int) ($item->istext ?? 1) === 1,
        'information' => $item->information,
        'pembahasan' => $item->pembahasan,
        'created_at' => $item->created_at ?? null,
        'updated_at' => $item->updated_at ?? null,
        'deleted_at' => $item->deleted_at ?? null,
        'options' => $options ?? [],
    ];
}

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'backend-api',
    ]);
});

Route::get('/landing', function () {
    return response()->json([
        'promo' => 'Satu langkah kecil hari ini, peluang besar di hari seleksi.',
        'hero' => [
            'title' => 'Satu Langkah',
            'highlight' => 'Menuju ASN.',
            'description' => 'Persiapan yang tepat dapat mengubah keraguan menjadi keyakinan.',
        ],
        'stats' => [
            ['platform' => 'YT', 'value' => '1.75Jt+', 'label' => 'Subscribers'],
            ['platform' => 'TT', 'value' => '742K+', 'label' => 'Followers'],
            ['platform' => 'IG', 'value' => '389K+', 'label' => 'Followers'],
            ['platform' => 'X', 'value' => '198K+', 'label' => 'Followers'],
        ],
    ]);
});

Route::get('/admin/dashboard-summary', function () {
    $totalUser = (int) DB::table('tbl_user')->count();
    $totalPackage = (int) DB::table('tbl_paket')->count();
    $totalTransaksi = (int) DB::table('tbl_transaksi')->count();
    $totalPendapatan = (float) DB::table('tbl_transaksi as t')
        ->leftJoin('tbl_paket as p', 't.pid_paket', '=', 'p.pid')
        ->where('t.status_transaksi', 'paid')
        ->sum('p.harga');

    return response()->json([
        'message' => 'Ringkasan dashboard admin.',
        'data' => [
            'total_user' => $totalUser,
            'total_transaksi' => $totalTransaksi,
            'total_pendapatan' => $totalPendapatan,
            'total_paket' => $totalPackage,
        ],
    ]);
});

Route::get('/admin/parameters', function (Request $request) {
    if (!Schema::hasTable('tbl_parameter')) {
        return parameterTableMissingResponse();
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

    $items = $query->get()->map(fn ($item) => mapParameterRow($item));

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
});

Route::get('/admin/parameters/{pid}', function ($pid) {
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
        'data' => mapParameterRow($item),
    ]);
});

Route::post('/admin/parameters', function (Request $request) {
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
        'data' => mapParameterRow(DB::table('tbl_parameter')->where('pid', $parameterId)->first()),
    ], 201);
});

Route::put('/admin/parameters/{pid}', function (Request $request, $pid) {
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
        'data' => mapParameterRow(DB::table('tbl_parameter')->where('pid', $pid)->first()),
    ]);
});

Route::get('/admin/faqs', function (Request $request) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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

    $items = $query->get()->map(fn ($item) => mapFaqRow($item));

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
});

Route::get('/admin/faqs/{pid}', function ($pid) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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
        'data' => mapFaqRow($item),
    ]);
});

Route::post('/admin/faqs', function (Request $request) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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
        'data' => mapFaqRow(DB::table('tbl_faq')->where('pid', $faqId)->first()),
    ], 201);
});

Route::put('/admin/faqs/{pid}', function (Request $request, $pid) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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
        'data' => mapFaqRow(DB::table('tbl_faq')->where('pid', $pid)->first()),
    ]);
});

Route::delete('/admin/faqs/{pid}', function ($pid) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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
});

Route::patch('/admin/faqs/{pid}/restore', function ($pid) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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
        'data' => mapFaqRow(DB::table('tbl_faq')->where('pid', $pid)->first()),
    ]);
});

Route::patch('/admin/faqs/{pid}/toggle', function ($pid) {
    if (!Schema::hasTable('tbl_faq')) {
        return faqTableMissingResponse();
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
        'data' => mapFaqRow(DB::table('tbl_faq')->where('pid', $pid)->first()),
    ]);
});

Route::get('/admin/users', function (Request $request) {
    $search = trim((string) $request->query('search', ''));
    $status = trim((string) $request->query('status', ''));
    $role = trim((string) $request->query('role', ''));

    $query = DB::table('tbl_user')
        ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
        ->select([
            'tbl_user.pid as pid',
            'tbl_user.email as email',
            'tbl_user.status as status',
            'tbl_user.is_admin as is_admin',
            'tbl_user.created_at as created_at',
            'tbl_detail_user.nama as nama',
            'tbl_detail_user.nohp as nohp',
        ])
        ->orderByDesc('tbl_user.created_at')
        ->orderByDesc('tbl_user.pid');

    if ($search !== '') {
        $query->where(function ($innerQuery) use ($search) {
            $innerQuery
                ->where('tbl_user.email', 'like', "%{$search}%")
                ->orWhere('tbl_detail_user.nama', 'like', "%{$search}%")
                ->orWhere('tbl_detail_user.nohp', 'like', "%{$search}%");
        });
    }

    if ($status !== '' && strtoupper($status) !== 'ALL') {
        $query->whereRaw('UPPER(tbl_user.status) = ?', [strtoupper($status)]);
    }

    if ($role !== '' && strtoupper($role) !== 'ALL') {
        $query->whereRaw("UPPER(CASE WHEN tbl_user.is_admin = 1 THEN 'ADMIN' ELSE 'USER' END) = ?", [strtoupper($role)]);
    }

    $users = $query->get()->map(function ($item) {
        $displayName = $item->nama ?: Str::before($item->email, '@');
        $joined = $item->created_at ? date('j M Y', strtotime($item->created_at)) : '-';

        return [
            'pid' => (int) $item->pid,
            'code' => '#USR-'.str_pad((string) $item->pid, 4, '0', STR_PAD_LEFT),
            'name' => $displayName,
            'email' => $item->email,
            'phone' => $item->nohp ?: '-',
            'role' => (int) $item->is_admin === 1 ? 'Admin' : 'User',
            'status' => (string) $item->status === 'active' ? 'Aktif' : 'Nonaktif',
            'joined' => $joined,
        ];
    });

    $summary = [
        'total_user' => (int) DB::table('tbl_user')->count(),
        'user_aktif' => (int) DB::table('tbl_user')->where('status', 'active')->count(),
        'user_nonaktif' => (int) DB::table('tbl_user')->where('status', 'inactive')->count(),
        'admin' => (int) DB::table('tbl_user')->where('is_admin', 1)->count(),
    ];

    return response()->json([
        'message' => 'Data user berhasil dimuat.',
        'summary' => $summary,
        'data' => $users,
    ]);
});

Route::get('/packages', function (Request $request) {
    $kategori = trim((string) $request->query('kategori', ''));

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
});

Route::get('/faqs', function () {
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
});

Route::get('/admin/questions', function (Request $request) {
    $group = trim((string) $request->query('group', ''));
    $type = trim((string) $request->query('type', ''));
    $search = trim((string) $request->query('search', ''));
    $includeTrashed = filter_var($request->query('include_trashed', false), FILTER_VALIDATE_BOOL);

    $query = DB::table('tbl_questions')
        ->select([
            'id',
            'question',
            'question_type',
            'question_group',
            'istext',
            'information',
            'pembahasan',
            'created_at',
            'updated_at',
            'deleted_at',
        ])
        ->orderByDesc('created_at')
        ->orderByDesc('id');

    if (!$includeTrashed) {
        $query->whereNull('deleted_at');
    }

    if ($group !== '' && in_array((int) $group, [1, 2, 3], true)) {
        $query->where('question_group', (int) $group);
    }

    if ($type !== '') {
        $query->where('question_type', $type);
    }

    if ($search !== '') {
        $query->where('question', 'like', "%{$search}%");
    }

    $questions = $query->get();
    $questionIds = $questions->pluck('id')->all();
    $optionsByQuestion = [];

    if (!empty($questionIds)) {
        $options = DB::table('tbl_question_options')
            ->select([
                'id',
                'question_id',
                'choise',
                'answer',
                'istext',
                'deleted_at',
            ])
            ->whereIn('question_id', $questionIds)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();

        foreach ($options as $option) {
            $optionsByQuestion[(int) $option->question_id] ??= [];
            $optionsByQuestion[(int) $option->question_id][] = mapQuestionOptionRow($option);
        }
    }

    $data = $questions->map(function ($item) use ($optionsByQuestion) {
        $group = (int) $item->question_group;
        $options = $optionsByQuestion[(int) $item->id] ?? [];
        $correctCount = count(array_filter($options, fn ($option) => (bool) ($option['answer'] ?? false)));

        return array_merge(mapQuestionRow($item, $options), [
            'options_count' => count($options),
            'correct_options_count' => $correctCount,
        ]);
    })->values();

    return response()->json([
        'message' => 'Data soal berhasil dimuat.',
        'summary' => [
            'total_questions' => DB::table('tbl_questions')->whereNull('deleted_at')->count(),
            'total_twk' => DB::table('tbl_questions')->whereNull('deleted_at')->where('question_group', 1)->count(),
            'total_tiu' => DB::table('tbl_questions')->whereNull('deleted_at')->where('question_group', 2)->count(),
            'total_tkp' => DB::table('tbl_questions')->whereNull('deleted_at')->where('question_group', 3)->count(),
        ],
        'data' => $data,
    ]);
});

Route::get('/admin/questions/{id}', function ($id) {
    $question = DB::table('tbl_questions')
        ->select([
            'id',
            'question',
            'question_type',
            'question_group',
            'istext',
            'information',
            'pembahasan',
            'created_at',
            'updated_at',
            'deleted_at',
        ])
        ->where('id', $id)
        ->first();

    if (!$question) {
        return response()->json(['message' => 'Soal tidak ditemukan.'], 404);
    }

    $options = DB::table('tbl_question_options')
        ->select([
            'id',
            'question_id',
            'choise',
            'answer',
            'istext',
            'deleted_at',
        ])
        ->where('question_id', $id)
        ->whereNull('deleted_at')
        ->orderBy('id')
        ->get()
        ->map(fn ($item) => mapQuestionOptionRow($item))
        ->values();

    return response()->json([
        'message' => 'Detail soal berhasil dimuat.',
        'data' => array_merge(mapQuestionRow($question, $options->all()), [
            'options_count' => $options->count(),
            'correct_options_count' => count(array_filter($options->all(), fn ($option) => (bool) ($option['answer'] ?? false))),
        ]),
    ]);
});

Route::post('/admin/questions', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'question' => ['required', 'string'],
        'question_type' => ['required', 'string', 'in:single'],
        'question_group' => ['required', 'integer', 'in:1,2,3'],
        'istext' => ['required', 'boolean'],
        'information' => ['nullable', 'string'],
        'pembahasan' => ['nullable', 'string'],
        'options' => ['required', 'array', 'min:2'],
        'options.*.choise' => ['required', 'string'],
        'options.*.answer' => ['nullable', 'boolean'],
        'options.*.istext' => ['nullable', 'boolean'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi soal gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();
    $normalizedOptions = collect($validated['options'])
        ->map(function ($option) {
            return [
                'choise' => trim((string) ($option['choise'] ?? '')),
                'answer' => (int) filter_var($option['answer'] ?? false, FILTER_VALIDATE_BOOL) === 1,
                'istext' => (int) filter_var($option['istext'] ?? true, FILTER_VALIDATE_BOOL) === 1,
            ];
        })
        ->filter(fn ($option) => $option['choise'] !== '')
        ->values();

    if ($normalizedOptions->count() < 2) {
        return response()->json([
            'message' => 'Minimal 2 opsi wajib diisi.',
        ], 422);
    }

    if ($normalizedOptions->where('answer', true)->count() !== 1) {
        return response()->json([
            'message' => 'Harus ada tepat 1 jawaban benar.',
        ], 422);
    }

    $now = now();
    $questionId = DB::transaction(function () use ($validated, $normalizedOptions, $request, $now) {
        $questionId = DB::table('tbl_questions')->insertGetId([
            'question' => $validated['question'],
            'question_type' => $validated['question_type'],
            'question_group' => $validated['question_group'],
            'istext' => (bool) $validated['istext'],
            'information' => $validated['information'] ?? null,
            'pembahasan' => $validated['pembahasan'] ?? null,
            'created_at' => $now,
            'updated_at' => null,
            'deleted_at' => null,
        ]);

        foreach ($normalizedOptions as $option) {
            DB::table('tbl_question_options')->insert([
                'question_id' => $questionId,
                'choise' => $option['choise'],
                'answer' => $option['answer'] ? 1 : 0,
                'istext' => $option['istext'] ? 1 : 0,
                'created_at' => $now,
                'updated_at' => null,
                'deleted_at' => null,
            ]);
        }

        return $questionId;
    });

    return response()->json([
        'message' => 'Soal berhasil ditambahkan.',
        'data' => DB::table('tbl_questions')->where('id', $questionId)->first(),
    ], 201);
});

Route::put('/admin/questions/{id}', function (Request $request, $id) {
    $validator = Validator::make($request->all(), [
        'question' => ['required', 'string'],
        'question_type' => ['required', 'string', 'in:single'],
        'question_group' => ['required', 'integer', 'in:1,2,3'],
        'istext' => ['required', 'boolean'],
        'information' => ['nullable', 'string'],
        'pembahasan' => ['nullable', 'string'],
        'options' => ['required', 'array', 'min:2'],
        'options.*.choise' => ['required', 'string'],
        'options.*.answer' => ['nullable', 'boolean'],
        'options.*.istext' => ['nullable', 'boolean'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi soal gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $existingQuestion = DB::table('tbl_questions')->where('id', $id)->first();
    if (!$existingQuestion) {
        return response()->json(['message' => 'Soal tidak ditemukan.'], 404);
    }

    $validated = $validator->validated();
    $normalizedOptions = collect($validated['options'])
        ->map(function ($option) {
            return [
                'choise' => trim((string) ($option['choise'] ?? '')),
                'answer' => (int) filter_var($option['answer'] ?? false, FILTER_VALIDATE_BOOL) === 1,
                'istext' => (int) filter_var($option['istext'] ?? true, FILTER_VALIDATE_BOOL) === 1,
            ];
        })
        ->filter(fn ($option) => $option['choise'] !== '')
        ->values();

    if ($normalizedOptions->count() < 2) {
        return response()->json([
            'message' => 'Minimal 2 opsi wajib diisi.',
        ], 422);
    }

    if ($normalizedOptions->where('answer', true)->count() !== 1) {
        return response()->json([
            'message' => 'Harus ada tepat 1 jawaban benar.',
        ], 422);
    }

    DB::transaction(function () use ($id, $validated, $normalizedOptions) {
        $now = now();

        DB::table('tbl_questions')
            ->where('id', $id)
            ->update([
                'question' => $validated['question'],
                'question_type' => $validated['question_type'],
                'question_group' => $validated['question_group'],
                'istext' => (bool) $validated['istext'],
                'information' => $validated['information'] ?? null,
                'pembahasan' => $validated['pembahasan'] ?? null,
                'updated_at' => $now,
                'deleted_at' => null,
            ]);

        DB::table('tbl_question_options')
            ->where('question_id', $id)
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => $now,
                'updated_at' => $now,
            ]);

        foreach ($normalizedOptions as $option) {
            DB::table('tbl_question_options')->insert([
                'question_id' => $id,
                'choise' => $option['choise'],
                'answer' => $option['answer'] ? 1 : 0,
                'istext' => $option['istext'] ? 1 : 0,
                'created_at' => $now,
                'updated_at' => null,
                'deleted_at' => null,
            ]);
        }
    });

    return response()->json([
        'message' => 'Soal berhasil diperbarui.',
        'data' => DB::table('tbl_questions')->where('id', $id)->first(),
    ]);
});

Route::delete('/admin/questions/{id}', function ($id) {
    $existingQuestion = DB::table('tbl_questions')
        ->where('id', $id)
        ->whereNull('deleted_at')
        ->first();

    if (!$existingQuestion) {
        return response()->json(['message' => 'Soal tidak ditemukan.'], 404);
    }

    DB::transaction(function () use ($id) {
        $now = now();

        DB::table('tbl_questions')
            ->where('id', $id)
            ->update([
                'deleted_at' => $now,
                'updated_at' => $now,
            ]);

        DB::table('tbl_question_options')
            ->where('question_id', $id)
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => $now,
                'updated_at' => $now,
            ]);
    });

    return response()->json([
        'message' => 'Soal berhasil dihapus.',
    ]);
});

Route::patch('/admin/questions/{id}/restore', function ($id) {
    $existingQuestion = DB::table('tbl_questions')
        ->where('id', $id)
        ->whereNotNull('deleted_at')
        ->first();

    if (!$existingQuestion) {
        return response()->json(['message' => 'Soal tidak ditemukan atau belum dihapus.'], 404);
    }

    DB::transaction(function () use ($id) {
        $now = now();

        DB::table('tbl_questions')
            ->where('id', $id)
            ->update([
                'deleted_at' => null,
                'updated_at' => $now,
            ]);

        DB::table('tbl_question_options')
            ->where('question_id', $id)
            ->update([
                'deleted_at' => null,
                'updated_at' => $now,
            ]);
    });

    return response()->json([
        'message' => 'Soal berhasil dipulihkan.',
    ]);
});

Route::get('/admin/packages', function (Request $request) {
    $kategori = trim((string) $request->query('kategori', ''));

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
            'typeClass' => strtoupper((string) $program) === 'PPPK' ? 'online' : 'tryout',
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
});

Route::post('/admin/packages', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'kategori' => ['required', 'string', 'max:100'],
        'formasi' => ['nullable', 'string', 'max:100'],
        'jadwal' => ['nullable', 'string', 'max:150'],
        'nama_paket' => ['required', 'string', 'max:150'],
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
    $now = now();

    $pid = DB::table('tbl_paket')->insertGetId([
        'kategori' => $validated['kategori'],
        'formasi' => $validated['formasi'] ?? null,
        'jadwal' => $validated['jadwal'] ?? null,
        'nama_paket' => $validated['nama_paket'],
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
});

Route::get('/admin/packages/{pid}', function ($pid) {
    $package = DB::table('tbl_paket')
        ->select([
            'pid',
            'kategori',
            'formasi',
            'jadwal',
            'nama_paket',
            'harga',
            'ket',
            'created_at',
            'created_by',
            'updated_at',
            'updated_by',
        ])
        ->where('pid', $pid)
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
            'harga' => (float) $package->harga,
            'ket' => $package->ket,
            'created_at' => $package->created_at,
            'created_by' => $package->created_by,
            'updated_at' => $package->updated_at,
            'updated_by' => $package->updated_by,
        ],
    ]);
});

Route::put('/admin/packages/{pid}', function (Request $request, $pid) {
    $validator = Validator::make($request->all(), [
        'kategori' => ['required', 'string', 'max:100'],
        'formasi' => ['nullable', 'string', 'max:100'],
        'jadwal' => ['nullable', 'string', 'max:150'],
        'nama_paket' => ['required', 'string', 'max:150'],
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

    DB::table('tbl_paket')
        ->where('pid', $pid)
        ->update([
            'kategori' => $validated['kategori'],
            'formasi' => $validated['formasi'] ?? null,
            'jadwal' => $validated['jadwal'] ?? null,
            'nama_paket' => $validated['nama_paket'],
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
});

Route::delete('/admin/packages/{pid}', function (Request $request, $pid) {
    $existingPackage = DB::table('tbl_paket')
        ->where('pid', $pid)
        ->whereNull('deleted_at')
        ->first();

    if (!$existingPackage) {
        return response()->json([
            'message' => 'Paket tidak ditemukan.',
        ], 404);
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
});

Route::get('/admin/transactions', function (Request $request) {
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
});

Route::get('/me', function (Request $request) {
    return response()->json([
        'authenticated' => $request->user() !== null,
        'user' => $request->user(),
    ]);
});

Route::get('/account-profile/{pid}', function ($pid) {
    $user = DB::table('tbl_user')
        ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
        ->where('tbl_user.pid', $pid)
        ->select([
            'tbl_user.pid as pid',
            'tbl_user.email as email',
            'tbl_user.status as status',
            'tbl_user.is_admin as is_admin',
            'tbl_detail_user.pid as detail_pid',
            'tbl_detail_user.nama as nama',
            'tbl_detail_user.ttl as ttl',
            'tbl_detail_user.gender as gender',
            'tbl_detail_user.nohp as nohp',
            'tbl_detail_user.alamat as alamat',
            'tbl_detail_user.refference as refference',
            'tbl_detail_user.reference_other as reference_other',
        ])
        ->first();

    if (!$user) {
        return response()->json([
            'message' => 'Data profil tidak ditemukan.',
        ], 404);
    }

    return response()->json([
        'message' => 'Data profil berhasil dimuat.',
        'data' => [
            'pid' => (int) $user->pid,
            'email' => $user->email,
            'status' => $user->status,
            'is_admin' => (int) $user->is_admin,
            'profile_completed' => $user->detail_pid !== null,
            'detail' => [
                'pid' => $user->detail_pid ? (int) $user->detail_pid : null,
                'nama' => $user->nama,
                'ttl' => $user->ttl,
                'gender' => $user->gender,
                'nohp' => $user->nohp,
                'alamat' => $user->alamat,
                'refference' => $user->refference,
                'reference_other' => $user->reference_other,
            ],
        ],
    ]);
});

Route::get('/captcha', function () {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';

    for ($index = 0; $index < 5; $index++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }

    $token = (string) Str::uuid();

    Cache::put("captcha:$token", hash('sha256', $code), now()->addMinutes(10));

    $noiseLines = '';
    for ($index = 0; $index < 4; $index++) {
        $x1 = random_int(10, 260);
        $y1 = random_int(18, 72);
        $x2 = random_int(20, 270);
        $y2 = random_int(18, 72);
        $noiseLines .= "<line x1=\"$x1\" y1=\"$y1\" x2=\"$x2\" y2=\"$y2\" stroke=\"rgba(34,102,173,0.25)\" stroke-width=\"2\" />";
    }

    $letters = '';
    foreach (str_split($code) as $index => $character) {
        $x = 34 + ($index * 46);
        $y = random_int(50, 62);
        $rotation = random_int(-12, 12);
        $letters .= "<text x=\"$x\" y=\"$y\" transform=\"rotate($rotation $x $y)\" fill=\"#0c2f61\" font-family=\"Arial, sans-serif\" font-size=\"34\" font-weight=\"700\">$character</text>";
    }

    $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="88" viewBox="0 0 280 88" role="img" aria-label="Captcha">
  <rect width="280" height="88" rx="18" fill="#eef7ff" />
  <rect x="1" y="1" width="278" height="86" rx="17" fill="none" stroke="rgba(90,157,220,0.36)" />
  $noiseLines
  $letters
</svg>
SVG;

    return response()->json([
        'token' => $token,
        'image' => 'data:image/svg+xml;base64,'.base64_encode($svg),
        'expires_in' => 600,
    ]);
});

Route::post('/register', function (Request $request) {
    $input = [
        'email' => $request->input('email'),
        'password' => $request->input('password'),
        'password_confirmation' => $request->input('password_confirmation', $request->input('confirmPassword')),
        'captcha_token' => $request->input('captcha_token', $request->input('captchaToken')),
        'captcha_answer' => strtoupper((string) $request->input('captcha_answer', $request->input('captchaAnswer'))),
    ];

    $validator = Validator::make($input, [
        'email' => ['required', 'email:rfc,dns', 'max:150', 'unique:tbl_user,email'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],
        'captcha_token' => ['required', 'string'],
        'captcha_answer' => ['required', 'string', 'size:5'],
    ], [
        'email.unique' => 'Email sudah terdaftar.',
        'password.confirmed' => 'Konfirmasi password tidak cocok.',
        'captcha_token.required' => 'Token captcha tidak ditemukan.',
        'captcha_answer.required' => 'Captcha wajib diisi.',
        'captcha_answer.size' => 'Captcha harus terdiri dari 5 karakter.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $cacheKey = "captcha:{$input['captcha_token']}";
    $expectedCaptchaHash = Cache::get($cacheKey);

    if (!$expectedCaptchaHash || !hash_equals($expectedCaptchaHash, hash('sha256', $input['captcha_answer']))) {
        return response()->json([
            'message' => 'Captcha tidak valid.',
            'errors' => [
                'captcha_answer' => ['Captcha yang kamu masukkan tidak sesuai.'],
            ],
        ], 422);
    }

    $userId = DB::table('tbl_user')->insertGetId([
        'email' => $input['email'],
        'password' => Hash::make($input['password']),
        'status' => 'active',
        'is_admin' => 0,
        'created_at' => now(),
        'created_by' => null,
        'updated_at' => null,
        'updated_by' => null,
    ]);

    Cache::forget($cacheKey);

    return response()->json([
        'message' => 'Akun berhasil dibuat.',
        'data' => [
            'pid' => $userId,
            'email' => $input['email'],
            'status' => 'active',
            'profile_completed' => false,
            'next_step' => 'Lengkapi profil pada tbl_detail_user.',
        ],
    ], 201);
});

Route::post('/login', function (Request $request) {
    $input = [
        'email' => $request->input('email'),
        'password' => $request->input('password'),
    ];

    $validator = Validator::make($input, [
        'email' => ['required', 'email:rfc,dns', 'max:150'],
        'password' => ['required', 'string'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi login gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $user = DB::table('tbl_user')
        ->where('email', $input['email'])
        ->first();

    if (!$user || !Hash::check($input['password'], $user->password)) {
        return response()->json([
            'message' => 'Email atau password tidak sesuai.',
            'errors' => [
                'email' => ['Email atau password tidak sesuai.'],
            ],
        ], 422);
    }

    if (($user->status ?? 'inactive') !== 'active') {
        return response()->json([
            'message' => 'Akun belum aktif.',
            'errors' => [
                'email' => ['Akun ini belum aktif.'],
            ],
        ], 403);
    }

    $detailUser = DB::table('tbl_detail_user')
        ->where('pid_user', $user->pid)
        ->first();

    return response()->json([
        'message' => 'Login berhasil.',
        'data' => [
            'pid' => $user->pid,
            'email' => $user->email,
            'status' => $user->status,
            'is_admin' => (int) ($user->is_admin ?? 0),
            'profile_completed' => $detailUser !== null,
            'next_step' => $detailUser ? 'Masuk ke beranda.' : 'Lengkapi profil terlebih dahulu.',
        ],
    ]);
});

Route::post('/complete-profile', function (Request $request) {
    $input = [
        'pid_user' => $request->input('pid_user', $request->input('pidUser')),
        'nama' => $request->input('nama', $request->input('name')),
        'ttl' => $request->input('ttl'),
        'gender' => $request->input('gender'),
        'nohp' => $request->input('nohp', $request->input('phone')),
        'alamat' => $request->input('alamat', $request->input('address')),
        'refference' => $request->input('refference', $request->input('reference')),
        'reference_other' => $request->input('reference_other', $request->input('referenceOther')),
    ];

    $validator = Validator::make($input, [
        'pid_user' => ['required', 'integer', 'exists:tbl_user,pid'],
        'nama' => ['required', 'string', 'max:150'],
        'ttl' => ['nullable', 'string', 'max:150'],
        'gender' => ['nullable', 'in:L,P'],
        'nohp' => ['nullable', 'string', 'max:30'],
        'alamat' => ['nullable', 'string'],
        'refference' => ['nullable', 'string', 'max:150'],
        'reference_other' => ['nullable', 'string', 'max:150', 'required_if:refference,Lainnya'],
    ], [
        'pid_user.required' => 'ID user tidak ditemukan.',
        'pid_user.exists' => 'User untuk profil ini tidak ditemukan.',
        'nama.required' => 'Nama wajib diisi.',
        'gender.in' => 'Jenis kelamin harus L atau P.',
        'reference_other.required_if' => 'Isi referensi lainnya jika memilih Lainnya.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi profil gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $existingDetail = DB::table('tbl_detail_user')
        ->where('pid_user', $input['pid_user'])
        ->first();

    $payload = [
        'nama' => $input['nama'],
        'ttl' => $input['ttl'] ?: null,
        'gender' => $input['gender'] ?: null,
        'nohp' => $input['nohp'] ?: null,
        'alamat' => $input['alamat'] ?: null,
        'refference' => $input['refference'] ?: null,
        'reference_other' => $input['refference'] === 'Lainnya' ? ($input['reference_other'] ?: null) : null,
        'updated_at' => now(),
        'updated_by' => $input['pid_user'],
    ];

    if ($existingDetail) {
        DB::table('tbl_detail_user')
            ->where('pid_user', $input['pid_user'])
            ->update($payload);

        $detailId = $existingDetail->pid;
    } else {
        $detailId = DB::table('tbl_detail_user')->insertGetId([
            'pid_user' => $input['pid_user'],
            'nama' => $input['nama'],
            'ttl' => $input['ttl'] ?: null,
            'gender' => $input['gender'] ?: null,
            'nohp' => $input['nohp'] ?: null,
            'alamat' => $input['alamat'] ?: null,
            'refference' => $input['refference'] ?: null,
            'reference_other' => $input['refference'] === 'Lainnya' ? ($input['reference_other'] ?: null) : null,
            'created_at' => now(),
            'created_by' => $input['pid_user'],
            'updated_at' => null,
            'updated_by' => null,
        ]);
    }

    return response()->json([
        'message' => 'Profil berhasil disimpan.',
        'data' => [
            'pid' => $detailId,
            'pid_user' => (int) $input['pid_user'],
            'profile_completed' => true,
            'next_step' => 'Login atau lanjut ke tahap belajar.',
        ],
    ]);
});
