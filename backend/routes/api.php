<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

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
    $totalPackage = (int) DB::table('tbl_paket')->sum(DB::raw('1'));

    return response()->json([
        'message' => 'Ringkasan dashboard admin.',
        'data' => [
            'total_paket' => $totalPackage,
        ],
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

Route::get('/admin/packages', function (Request $request) {
    $kategori = trim((string) $request->query('kategori', ''));

    $query = DB::table('tbl_paket')
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
        'total_paket' => (int) DB::table('tbl_paket')->count(),
        'paket_aktif' => (int) DB::table('tbl_paket')->count(),
        'paket_nonaktif' => 0,
        'total_penjualan' => (float) DB::table('tbl_paket')->sum('harga'),
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
    ];

    $validator = Validator::make($input, [
        'pid_user' => ['required', 'integer', 'exists:tbl_user,pid'],
        'nama' => ['required', 'string', 'max:150'],
        'ttl' => ['nullable', 'string', 'max:150'],
        'gender' => ['nullable', 'in:L,P'],
        'nohp' => ['nullable', 'string', 'max:30'],
        'alamat' => ['nullable', 'string'],
        'refference' => ['nullable', 'string', 'max:150'],
    ], [
        'pid_user.required' => 'ID user tidak ditemukan.',
        'pid_user.exists' => 'User untuk profil ini tidak ditemukan.',
        'nama.required' => 'Nama wajib diisi.',
        'gender.in' => 'Jenis kelamin harus L atau P.',
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
