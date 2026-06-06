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
