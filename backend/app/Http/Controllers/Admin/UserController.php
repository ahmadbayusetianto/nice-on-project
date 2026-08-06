<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
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
    }

    public function store(Request $request)
    {
        $input = [
            'email' => $request->input('email'),
            'password' => $request->input('password'),
            'status' => $request->input('status', 'active'),
            'is_admin' => $request->input('is_admin', false),
            'nama' => $request->input('nama'),
            'ttl' => $request->input('ttl'),
            'gender' => $request->input('gender'),
            'nohp' => $request->input('nohp'),
            'alamat' => $request->input('alamat'),
            'refference' => $request->input('refference'),
            'reference_other' => $request->input('reference_other'),
        ];

        $validator = Validator::make($input, [
            'email' => ['required', 'email:rfc,dns', 'max:150', 'unique:tbl_user,email'],
            'password' => ['required', 'string', 'min:8'],
            'status' => ['required', 'in:active,inactive,Active,Inactive,AKTIF,NONAKTIF,Aktif,Nonaktif'],
            'is_admin' => ['required', 'boolean'],
            'nama' => ['required', 'string', 'max:150'],
            'ttl' => ['nullable', 'string', 'max:150'],
            'gender' => ['nullable', 'in:L,P'],
            'nohp' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'refference' => ['nullable', 'string', 'max:150'],
            'reference_other' => ['nullable', 'string', 'max:150', 'required_if:refference,Lainnya'],
        ], [
            'email.unique' => 'Email sudah digunakan oleh user lain.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'status.required' => 'Status wajib diisi.',
            'is_admin.required' => 'Role user wajib diisi.',
            'nama.required' => 'Nama wajib diisi.',
            'gender.in' => 'Jenis kelamin harus L atau P.',
            'reference_other.required_if' => 'Isi referensi lainnya jika memilih Lainnya.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi user gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $normalizedStatus = strtolower(trim((string) $validated['status'])) === 'inactive' || strtolower(trim((string) $validated['status'])) === 'nonaktif'
            ? 'inactive'
            : 'active';
        $isAdmin = (int) filter_var($validated['is_admin'], FILTER_VALIDATE_BOOL) === 1 ? 1 : 0;

        $newUserId = DB::transaction(function () use ($validated, $normalizedStatus, $isAdmin) {
            $now = now();

            $userId = DB::table('tbl_user')->insertGetId([
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'status' => $normalizedStatus,
                'is_admin' => $isAdmin,
                'created_at' => $now,
                'created_by' => null,
                'updated_at' => null,
                'updated_by' => null,
            ]);

            DB::table('tbl_detail_user')->insert([
                'pid_user' => $userId,
                'nama' => $validated['nama'],
                'ttl' => $validated['ttl'] ?: null,
                'gender' => $validated['gender'] ?: null,
                'nohp' => $validated['nohp'] ?: null,
                'alamat' => $validated['alamat'] ?: null,
                'refference' => $validated['refference'] ?: null,
                'reference_other' => $validated['refference'] === 'Lainnya' ? ($validated['reference_other'] ?: null) : null,
                'created_at' => $now,
                'created_by' => null,
                'updated_at' => null,
                'updated_by' => null,
            ]);

            return $userId;
        });

        $newUser = DB::table('tbl_user')
            ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
            ->where('tbl_user.pid', $newUserId)
            ->select([
                'tbl_user.pid as pid',
                'tbl_user.email as email',
                'tbl_user.status as status',
                'tbl_user.is_admin as is_admin',
                'tbl_user.created_at as created_at',
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

        return response()->json([
            'message' => 'User berhasil ditambahkan.',
            'data' => [
                'pid' => (int) $newUser->pid,
                'code' => '#USR-'.str_pad((string) $newUser->pid, 4, '0', STR_PAD_LEFT),
                'email' => $newUser->email,
                'status' => (string) $newUser->status === 'active' ? 'Aktif' : 'Nonaktif',
                'status_key' => (string) $newUser->status === 'active' ? 'active' : 'inactive',
                'is_admin' => (int) $newUser->is_admin,
                'role' => (int) $newUser->is_admin === 1 ? 'Admin' : 'User',
                'created_at' => $newUser->created_at,
                'joined' => $newUser->created_at ? date('j M Y', strtotime($newUser->created_at)) : '-',
                'profile_completed' => true,
                'detail' => [
                    'pid' => $newUser->detail_pid ? (int) $newUser->detail_pid : null,
                    'nama' => $newUser->nama,
                    'ttl' => $newUser->ttl,
                    'gender' => $newUser->gender,
                    'nohp' => $newUser->nohp,
                    'alamat' => $newUser->alamat,
                    'refference' => $newUser->refference,
                    'reference_other' => $newUser->reference_other,
                ],
            ],
        ], 201);
    }

    public function toggleRole($pid)
    {
        $user = DB::table('tbl_user')->where('pid', $pid)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $currentIsAdmin = (int) ($user->is_admin ?? 0) === 1;
        $wasActiveAdmin = $currentIsAdmin && (string) ($user->status ?? '') === 'active';

        if ($wasActiveAdmin) {
            $otherActiveAdminCount = (int) DB::table('tbl_user')
                ->where('is_admin', 1)
                ->where('status', 'active')
                ->where('pid', '!=', $pid)
                ->count();

            if ($otherActiveAdminCount < 1) {
                return response()->json([
                    'message' => 'Minimal harus ada satu admin aktif.',
                ], 409);
            }
        }

        $nextIsAdmin = $currentIsAdmin ? 0 : 1;

        DB::table('tbl_user')
            ->where('pid', $pid)
            ->update([
                'is_admin' => $nextIsAdmin,
                'updated_at' => now(),
                'updated_by' => null,
            ]);

        $updatedUser = DB::table('tbl_user')
            ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
            ->where('tbl_user.pid', $pid)
            ->select([
                'tbl_user.pid as pid',
                'tbl_user.email as email',
                'tbl_user.status as status',
                'tbl_user.is_admin as is_admin',
                'tbl_user.created_at as created_at',
                'tbl_detail_user.nama as nama',
                'tbl_detail_user.nohp as nohp',
            ])
            ->first();

        $displayName = $updatedUser->nama ?: Str::before($updatedUser->email, '@');

        return response()->json([
            'message' => 'Peran user berhasil diperbarui.',
            'data' => [
                'pid' => (int) $updatedUser->pid,
                'code' => '#USR-'.str_pad((string) $updatedUser->pid, 4, '0', STR_PAD_LEFT),
                'name' => $displayName,
                'email' => $updatedUser->email,
                'phone' => $updatedUser->nohp ?: '-',
                'role' => (int) $updatedUser->is_admin === 1 ? 'Admin' : 'User',
                'status' => (string) $updatedUser->status === 'active' ? 'Aktif' : 'Nonaktif',
                'joined' => $updatedUser->created_at ? date('j M Y', strtotime($updatedUser->created_at)) : '-',
                'is_admin' => (int) $updatedUser->is_admin,
            ],
        ]);
    }

    public function show($pid)
    {
        $user = DB::table('tbl_user')
            ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
            ->where('tbl_user.pid', $pid)
            ->select([
                'tbl_user.pid as pid',
                'tbl_user.email as email',
                'tbl_user.status as status',
                'tbl_user.is_admin as is_admin',
                'tbl_user.created_at as created_at',
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
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail user berhasil dimuat.',
            'data' => [
                'pid' => (int) $user->pid,
                'code' => '#USR-'.str_pad((string) $user->pid, 4, '0', STR_PAD_LEFT),
                'email' => $user->email,
                'status' => (string) $user->status === 'active' ? 'Aktif' : 'Nonaktif',
                'status_key' => (string) $user->status === 'active' ? 'active' : 'inactive',
                'is_admin' => (int) $user->is_admin,
                'role' => (int) $user->is_admin === 1 ? 'Admin' : 'User',
                'created_at' => $user->created_at,
                'joined' => $user->created_at ? date('j M Y', strtotime($user->created_at)) : '-',
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
    }

    public function update(Request $request, $pid)
    {
        $user = DB::table('tbl_user')->where('pid', $pid)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $input = [
            'email' => $request->input('email'),
            'status' => $request->input('status', $request->input('user_status', $user->status ?? 'active')),
            'is_admin' => $request->input('is_admin', $request->input('role', (int) ($user->is_admin ?? 0) === 1 ? 1 : 0)),
            'nama' => $request->input('nama', $request->input('name')),
            'ttl' => $request->input('ttl'),
            'gender' => $request->input('gender'),
            'nohp' => $request->input('nohp', $request->input('phone')),
            'alamat' => $request->input('alamat', $request->input('address')),
            'refference' => $request->input('refference', $request->input('reference')),
            'reference_other' => $request->input('reference_other', $request->input('referenceOther')),
        ];

        $validator = Validator::make($input, [
            'email' => ['required', 'email:rfc,dns', 'max:150', 'unique:tbl_user,email,' . $pid . ',pid'],
            'status' => ['required', 'in:active,inactive,Active,Inactive,AKTIF,NONAKTIF,Aktif,Nonaktif'],
            'is_admin' => ['required', 'boolean'],
            'nama' => ['required', 'string', 'max:150'],
            'ttl' => ['nullable', 'string', 'max:150'],
            'gender' => ['nullable', 'in:L,P'],
            'nohp' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'refference' => ['nullable', 'string', 'max:150'],
            'reference_other' => ['nullable', 'string', 'max:150', 'required_if:refference,Lainnya'],
        ], [
            'email.unique' => 'Email sudah digunakan oleh user lain.',
            'status.required' => 'Status wajib diisi.',
            'is_admin.required' => 'Role user wajib diisi.',
            'nama.required' => 'Nama wajib diisi.',
            'gender.in' => 'Jenis kelamin harus L atau P.',
            'reference_other.required_if' => 'Isi referensi lainnya jika memilih Lainnya.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi user gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $normalizedStatus = strtolower(trim((string) $validated['status'])) === 'inactive' || strtolower(trim((string) $validated['status'])) === 'nonaktif'
            ? 'inactive'
            : 'active';
        $nextIsAdmin = (int) filter_var($validated['is_admin'], FILTER_VALIDATE_BOOL) === 1 ? 1 : 0;

        $wasActiveAdmin = (int) ($user->is_admin ?? 0) === 1 && (string) ($user->status ?? '') === 'active';
        $willBeActiveAdmin = $nextIsAdmin === 1 && $normalizedStatus === 'active';

        if ($wasActiveAdmin && !$willBeActiveAdmin) {
            $otherActiveAdminCount = (int) DB::table('tbl_user')
                ->where('is_admin', 1)
                ->where('status', 'active')
                ->where('pid', '!=', $pid)
                ->count();

            if ($otherActiveAdminCount < 1) {
                return response()->json([
                    'message' => 'Minimal harus ada satu admin aktif.',
                ], 409);
            }
        }

        DB::transaction(function () use ($pid, $validated, $normalizedStatus, $nextIsAdmin) {
            $now = now();

            DB::table('tbl_user')
                ->where('pid', $pid)
                ->update([
                    'email' => $validated['email'],
                    'status' => $normalizedStatus,
                    'is_admin' => $nextIsAdmin,
                    'updated_at' => $now,
                    'updated_by' => null,
                ]);

            $detailPayload = [
                'nama' => $validated['nama'],
                'ttl' => $validated['ttl'] ?: null,
                'gender' => $validated['gender'] ?: null,
                'nohp' => $validated['nohp'] ?: null,
                'alamat' => $validated['alamat'] ?: null,
                'refference' => $validated['refference'] ?: null,
                'reference_other' => $validated['refference'] === 'Lainnya' ? ($validated['reference_other'] ?: null) : null,
                'updated_at' => $now,
                'updated_by' => null,
            ];

            $existingDetail = DB::table('tbl_detail_user')->where('pid_user', $pid)->first();

            if ($existingDetail) {
                DB::table('tbl_detail_user')
                    ->where('pid_user', $pid)
                    ->update($detailPayload);
            } else {
                DB::table('tbl_detail_user')->insert([
                    'pid_user' => $pid,
                    'nama' => $detailPayload['nama'],
                    'ttl' => $detailPayload['ttl'],
                    'gender' => $detailPayload['gender'],
                    'nohp' => $detailPayload['nohp'],
                    'alamat' => $detailPayload['alamat'],
                    'refference' => $detailPayload['refference'],
                    'reference_other' => $detailPayload['reference_other'],
                    'created_at' => $now,
                    'created_by' => null,
                    'updated_at' => null,
                    'updated_by' => null,
                ]);
            }
        });

        $updatedUser = DB::table('tbl_user')
            ->leftJoin('tbl_detail_user', 'tbl_user.pid', '=', 'tbl_detail_user.pid_user')
            ->where('tbl_user.pid', $pid)
            ->select([
                'tbl_user.pid as pid',
                'tbl_user.email as email',
                'tbl_user.status as status',
                'tbl_user.is_admin as is_admin',
                'tbl_user.created_at as created_at',
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

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => [
                'pid' => (int) $updatedUser->pid,
                'code' => '#USR-'.str_pad((string) $updatedUser->pid, 4, '0', STR_PAD_LEFT),
                'email' => $updatedUser->email,
                'status' => (string) $updatedUser->status === 'active' ? 'Aktif' : 'Nonaktif',
                'status_key' => (string) $updatedUser->status === 'active' ? 'active' : 'inactive',
                'is_admin' => (int) $updatedUser->is_admin,
                'role' => (int) $updatedUser->is_admin === 1 ? 'Admin' : 'User',
                'created_at' => $updatedUser->created_at,
                'joined' => $updatedUser->created_at ? date('j M Y', strtotime($updatedUser->created_at)) : '-',
                'profile_completed' => $updatedUser->detail_pid !== null,
                'detail' => [
                    'pid' => $updatedUser->detail_pid ? (int) $updatedUser->detail_pid : null,
                    'nama' => $updatedUser->nama,
                    'ttl' => $updatedUser->ttl,
                    'gender' => $updatedUser->gender,
                    'nohp' => $updatedUser->nohp,
                    'alamat' => $updatedUser->alamat,
                    'refference' => $updatedUser->refference,
                    'reference_other' => $updatedUser->reference_other,
                ],
            ],
        ]);
    }
}
