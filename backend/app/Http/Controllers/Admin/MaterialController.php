<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminNotificationService;
use App\Services\PackageAccessService;
use App\Services\SystemParameterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Throwable;

class MaterialController extends Controller
{
    private function formatFileSize(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = (float) $bytes;
        $unitIndex = 0;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return number_format($size, $unitIndex === 0 ? 0 : 1, ',', '.') . ' ' . $units[$unitIndex];
    }

    private function mapRow(object $item): array
    {
        $isPublished = (int) ($item->is_published ?? 1) === 1;

        return [
            'pid' => (int) $item->pid,
            'package_id' => (int) $item->package_id,
            'package_name' => (string) ($item->nama_paket ?? '-'),
            'judul' => (string) $item->judul,
            'deskripsi' => (string) ($item->deskripsi ?? ''),
            'original_name' => (string) $item->original_name,
            'mime_type' => (string) ($item->mime_type ?? 'application/pdf'),
            'file_size' => (int) ($item->file_size ?? 0),
            'file_size_label' => $this->formatFileSize((int) ($item->file_size ?? 0)),
            'sort_order' => (int) ($item->sort_order ?? 0),
            'is_published' => $isPublished,
            'status' => $isPublished ? 'Terbit' : 'Draft',
            'status_key' => $isPublished ? 'published' : 'draft',
            'created_at' => $item->created_at ?? null,
            'updated_at' => $item->updated_at ?? null,
            'deleted_at' => $item->deleted_at ?? null,
        ];
    }

    private function tableMissingResponse()
    {
        return response()->json([
            'message' => 'Tabel materi belum tersedia. Jalankan migrasi database terlebih dahulu.',
            'summary' => [
                'total_materi' => 0,
                'materi_terbit' => 0,
                'materi_draft' => 0,
            ],
            'packages' => [],
            'data' => [],
        ], 503);
    }

    private function maxUploadKb(): int
    {
        return max(1, (new SystemParameterService())->intValue('system.max_upload_size', 5)) * 1024;
    }

    public function index(Request $request)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $search = trim((string) $request->query('search', ''));
        $packageId = (int) $request->query('package_id', 0);
        $status = trim((string) $request->query('status', 'ALL'));

        $query = DB::table('tbl_materi as m')
            ->leftJoin('tbl_paket as p', 'm.package_id', '=', 'p.pid')
            ->select([
                'm.pid',
                'm.package_id',
                'm.judul',
                'm.deskripsi',
                'm.file_path',
                'm.original_name',
                'm.mime_type',
                'm.file_size',
                'm.sort_order',
                'm.is_published',
                'm.created_at',
                'm.updated_at',
                'm.deleted_at',
                'p.nama_paket',
                'p.kategori',
            ])
            ->orderByDesc('m.sort_order')
            ->orderByDesc('m.created_at')
            ->orderByDesc('m.pid');

        if ($search !== '') {
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('m.judul', 'like', "%{$search}%")
                    ->orWhere('m.deskripsi', 'like', "%{$search}%")
                    ->orWhere('m.original_name', 'like', "%{$search}%")
                    ->orWhere('p.nama_paket', 'like', "%{$search}%")
                    ->orWhere('p.kategori', 'like', "%{$search}%");
            });
        }

        if ($packageId > 0) {
            $query->where('m.package_id', $packageId);
        }

        if ($status !== '' && strtoupper($status) !== 'ALL') {
            if (strtoupper($status) === 'PUBLISHED') {
                $query->where('m.is_published', 1);
            }

            if (strtoupper($status) === 'DRAFT') {
                $query->where('m.is_published', 0);
            }
        }

        $materials = $query->get()->map(fn ($item) => $this->mapRow($item));

        $summary = [
            'total_materi' => (int) DB::table('tbl_materi')->count(),
            'materi_terbit' => (int) DB::table('tbl_materi')->where('is_published', 1)->count(),
            'materi_draft' => (int) DB::table('tbl_materi')->where('is_published', 0)->count(),
        ];

        $packages = DB::table('tbl_paket')
            ->whereNull('deleted_at')
            ->select(['pid', 'nama_paket', 'kategori'])
            ->orderBy('nama_paket')
            ->get()
            ->map(fn ($item) => [
                'pid' => (int) $item->pid,
                'name' => (string) $item->nama_paket,
                'kategori' => (string) $item->kategori,
            ]);

        return response()->json([
            'message' => 'Data materi admin berhasil dimuat.',
            'summary' => $summary,
            'packages' => $packages,
            'data' => $materials,
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $validator = Validator::make($request->all(), [
            'package_id' => ['required', 'integer', 'exists:tbl_paket,pid'],
            'judul' => ['required', 'string', 'max:200'],
            'deskripsi' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['nullable', 'boolean'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:' . $this->maxUploadKb()],
        ], [
            'package_id.required' => 'Paket wajib dipilih.',
            'package_id.exists' => 'Paket tidak ditemukan.',
            'judul.required' => 'Judul materi wajib diisi.',
            'file.required' => 'File PDF wajib diunggah.',
            'file.mimes' => 'File harus berformat PDF.',
            'file.max' => 'Ukuran file melebihi batas maksimal.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi materi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $package = DB::table('tbl_paket')
            ->where('pid', $validated['package_id'])
            ->whereNull('deleted_at')
            ->first();

        if (!$package) {
            return response()->json([
                'message' => 'Paket tidak ditemukan.',
            ], 404);
        }

        $uploadedFile = $request->file('file');
        $safeFileName = Str::slug($validated['judul']) ?: 'materi';
        $safeFileName .= '-' . now()->format('YmdHis') . '.pdf';
        $storedPath = null;

        try {
            $storedPath = Storage::disk('local')->putFileAs('materials', $uploadedFile, $safeFileName);

            $pid = DB::table('tbl_materi')->insertGetId([
                'package_id' => (int) $validated['package_id'],
                'judul' => $validated['judul'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'file_path' => $storedPath,
                'original_name' => $uploadedFile->getClientOriginalName(),
                'mime_type' => $uploadedFile->getClientMimeType() ?: 'application/pdf',
                'file_size' => (int) ($uploadedFile->getSize() ?: 0),
                'sort_order' => (int) ($validated['sort_order'] ?? 0),
                'is_published' => (int) ($validated['is_published'] ?? 1) === 1 ? 1 : 0,
                'created_at' => now(),
                'created_by' => $request->user()->pid ?? null,
                'updated_at' => null,
                'updated_by' => null,
                'deleted_at' => null,
            ]);
        } catch (Throwable $error) {
            if ($storedPath && Storage::disk('local')->exists($storedPath)) {
                Storage::disk('local')->delete($storedPath);
            }

            throw $error;
        }

        $material = DB::table('tbl_materi as m')
            ->leftJoin('tbl_paket as p', 'm.package_id', '=', 'p.pid')
            ->where('m.pid', $pid)
            ->select([
                'm.*',
                'p.nama_paket',
            ])
            ->first();

        return response()->json([
            'message' => 'Materi berhasil diunggah.',
            'data' => $this->mapRow($material),
        ], 201);
    }

    public function show($pid)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $material = DB::table('tbl_materi as m')
            ->leftJoin('tbl_paket as p', 'm.package_id', '=', 'p.pid')
            ->where('m.pid', $pid)
            ->select([
                'm.pid',
                'm.package_id',
                'm.judul',
                'm.deskripsi',
                'm.file_path',
                'm.original_name',
                'm.mime_type',
                'm.file_size',
                'm.sort_order',
                'm.is_published',
                'm.created_at',
                'm.updated_at',
                'm.deleted_at',
                'p.nama_paket',
                'p.kategori',
            ])
            ->first();

        if (!$material) {
            return response()->json([
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail materi berhasil dimuat.',
            'data' => $this->mapRow($material),
        ]);
    }

    public function update(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $existingMaterial = DB::table('tbl_materi')
            ->where('pid', $pid)
            ->first();

        if (!$existingMaterial) {
            return response()->json([
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'package_id' => ['required', 'integer', 'exists:tbl_paket,pid'],
            'judul' => ['required', 'string', 'max:200'],
            'deskripsi' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['nullable', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:' . $this->maxUploadKb()],
        ], [
            'package_id.required' => 'Paket wajib dipilih.',
            'package_id.exists' => 'Paket tidak ditemukan.',
            'judul.required' => 'Judul materi wajib diisi.',
            'file.mimes' => 'File harus berformat PDF.',
            'file.max' => 'Ukuran file melebihi batas maksimal.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi materi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $package = DB::table('tbl_paket')
            ->where('pid', $validated['package_id'])
            ->whereNull('deleted_at')
            ->first();

        if (!$package) {
            return response()->json([
                'message' => 'Paket tidak ditemukan.',
            ], 404);
        }

        $now = now();
        $nextFilePath = $existingMaterial->file_path;
        $oldFilePath = $existingMaterial->file_path;
        $uploadedFile = $request->file('file');
        $replaceFile = false;

        try {
            if ($uploadedFile) {
                $safeFileName = Str::slug($validated['judul']) ?: 'materi';
                $safeFileName .= '-' . $now->format('YmdHis') . '.pdf';
                $nextFilePath = Storage::disk('local')->putFileAs('materials', $uploadedFile, $safeFileName);
                $replaceFile = true;
            }

            DB::table('tbl_materi')
                ->where('pid', $pid)
                ->update([
                    'package_id' => (int) $validated['package_id'],
                    'judul' => $validated['judul'],
                    'deskripsi' => $validated['deskripsi'] ?? null,
                    'file_path' => $nextFilePath,
                    'original_name' => $uploadedFile?->getClientOriginalName() ?? $existingMaterial->original_name,
                    'mime_type' => $uploadedFile?->getClientMimeType() ?: $existingMaterial->mime_type,
                    'file_size' => (int) ($uploadedFile?->getSize() ?: $existingMaterial->file_size),
                    'sort_order' => (int) ($validated['sort_order'] ?? 0),
                    'is_published' => (int) ($validated['is_published'] ?? 1) === 1 ? 1 : 0,
                    'updated_at' => $now,
                    'updated_by' => $request->user()->pid ?? null,
                ]);
        } catch (Throwable $error) {
            if ($replaceFile && $nextFilePath && Storage::disk('local')->exists($nextFilePath)) {
                Storage::disk('local')->delete($nextFilePath);
            }

            throw $error;
        }

        if ($replaceFile && $oldFilePath && $oldFilePath !== $nextFilePath && Storage::disk('local')->exists($oldFilePath)) {
            Storage::disk('local')->delete($oldFilePath);
        }

        $material = DB::table('tbl_materi as m')
            ->leftJoin('tbl_paket as p', 'm.package_id', '=', 'p.pid')
            ->where('m.pid', $pid)
            ->select([
                'm.pid',
                'm.package_id',
                'm.judul',
                'm.deskripsi',
                'm.file_path',
                'm.original_name',
                'm.mime_type',
                'm.file_size',
                'm.sort_order',
                'm.is_published',
                'm.created_at',
                'm.updated_at',
                'm.deleted_at',
                'p.nama_paket',
                'p.kategori',
            ])
            ->first();

        return response()->json([
            'message' => 'Materi berhasil diperbarui.',
            'data' => $this->mapRow($material),
        ]);
    }

    public function destroy(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $material = DB::table('tbl_materi')
            ->where('pid', $pid)
            ->whereNull('deleted_at')
            ->first();

        if (!$material) {
            return response()->json([
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        DB::table('tbl_materi')
            ->where('pid', $pid)
            ->update([
                'deleted_at' => now(),
                'updated_at' => now(),
                'updated_by' => $request->user()->pid ?? null,
            ]);

        if (!empty($material->file_path) && Storage::disk('local')->exists($material->file_path)) {
            Storage::disk('local')->delete($material->file_path);
        }

        return response()->json([
            'message' => 'Materi berhasil dihapus.',
        ]);
    }

    public function download($pid)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $material = DB::table('tbl_materi')
            ->where('pid', $pid)
            ->whereNull('deleted_at')
            ->first();

        if (!$material) {
            return response()->json([
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        if (!Storage::disk('local')->exists($material->file_path)) {
            return response()->json([
                'message' => 'File materi tidak ditemukan.',
            ], 404);
        }

        $stream = Storage::disk('local')->readStream($material->file_path);
        if ($stream === false) {
            return response()->json([
                'message' => 'File materi tidak dapat dibuka.',
            ], 500);
        }

        $filename = str_replace('"', '', $material->original_name ?: ($material->judul . '.pdf'));

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $material->mime_type ?: 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Content-Length' => (string) Storage::disk('local')->size($material->file_path),
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0, must-revalidate',
        ]);
    }

    public function publicIndex(Request $request)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $userId = (int) $request->query('user_id', 0);
        $search = trim((string) $request->query('search', ''));
        $packageId = (int) $request->query('package_id', 0);
        $accessiblePackageIds = (new PackageAccessService())->userPurchasedPackageIds($userId);

        if (empty($accessiblePackageIds)) {
            return response()->json([
                'message' => 'Data materi berhasil dimuat.',
                'summary' => [
                    'total_materi' => 0,
                    'total_paket' => 0,
                ],
                'packages' => [],
                'data' => [],
            ]);
        }

        $query = DB::table('tbl_materi as m')
            ->leftJoin('tbl_paket as p', 'm.package_id', '=', 'p.pid')
            ->whereNull('m.deleted_at')
            ->where('m.is_published', 1)
            ->whereIn('m.package_id', $accessiblePackageIds)
            ->select([
                'm.pid',
                'm.package_id',
                'm.judul',
                'm.deskripsi',
                'm.file_path',
                'm.original_name',
                'm.mime_type',
                'm.file_size',
                'm.sort_order',
                'm.is_published',
                'm.created_at',
                'm.updated_at',
                'p.nama_paket',
                'p.kategori',
            ])
            ->orderByDesc('m.sort_order')
            ->orderByDesc('m.created_at')
            ->orderByDesc('m.pid');

        if ($search !== '') {
            $query->where(function ($innerQuery) use ($search) {
                $innerQuery
                    ->where('m.judul', 'like', "%{$search}%")
                    ->orWhere('m.deskripsi', 'like', "%{$search}%")
                    ->orWhere('p.nama_paket', 'like', "%{$search}%")
                    ->orWhere('p.kategori', 'like', "%{$search}%");
            });
        }

        if ($packageId > 0 && in_array($packageId, $accessiblePackageIds, true)) {
            $query->where('m.package_id', $packageId);
        }

        $materials = $query->get()->map(fn ($item) => $this->mapRow($item));

        $packages = DB::table('tbl_paket as p')
            ->whereNull('p.deleted_at')
            ->whereIn('p.pid', $accessiblePackageIds)
            ->select(['p.pid', 'p.nama_paket', 'p.kategori'])
            ->orderBy('p.nama_paket')
            ->get()
            ->map(fn ($item) => [
                'pid' => (int) $item->pid,
                'name' => (string) $item->nama_paket,
                'kategori' => (string) $item->kategori,
            ]);

        return response()->json([
            'message' => 'Data materi berhasil dimuat.',
            'summary' => [
                'total_materi' => count($materials),
                'total_paket' => count($packages),
            ],
            'packages' => $packages,
            'data' => $materials,
        ]);
    }

    public function view(Request $request, $pid)
    {
        if (!Schema::hasTable('tbl_materi')) {
            return $this->tableMissingResponse();
        }

        $material = DB::table('tbl_materi as m')
            ->leftJoin('tbl_paket as p', 'm.package_id', '=', 'p.pid')
            ->where('m.pid', $pid)
            ->whereNull('m.deleted_at')
            ->select([
                'm.pid',
                'm.package_id',
                'm.judul',
                'm.file_path',
                'm.original_name',
                'm.mime_type',
                'm.file_size',
                'm.is_published',
                'p.nama_paket',
                'p.kategori',
            ])
            ->first();

        if (!$material) {
            return response()->json([
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        // NOTE: user_id still comes from the request (query/body), not
        // $request->user()->id — Tahap 1 (real Auth::login() sessions)
        // hasn't landed yet, so $request->user() is always null pre-auth.
        // Switching this now would break material access for every real
        // user, not just tighten it. Revisit once Tahap 1 lands.
        $userId = (int) $request->query('user_id', $request->input('user_id', 0));
        $isAdmin = (int) ($request->user()->is_admin ?? 0) === 1;

        if (!$isAdmin && !(new PackageAccessService())->userHasMaterialAccess($userId, (int) $material->package_id)) {
            return response()->json([
                'message' => 'Anda belum memiliki akses ke materi ini.',
            ], 403);
        }

        if (!Storage::disk('local')->exists($material->file_path)) {
            return response()->json([
                'message' => 'File materi tidak ditemukan.',
            ], 404);
        }

        $stream = Storage::disk('local')->readStream($material->file_path);
        if ($stream === false) {
            return response()->json([
                'message' => 'File materi tidak dapat dibuka.',
            ], 500);
        }

        $filename = str_replace('"', '', $material->original_name ?: ($material->judul . '.pdf'));
        $headers = [
            'Content-Type' => $material->mime_type ?: 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Content-Length' => (string) Storage::disk('local')->size($material->file_path),
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0, must-revalidate',
        ];

        (new AdminNotificationService())->notify(
            'material.viewed',
            'Materi dibuka user',
            'User #' . $userId . ' membuka materi ' . $material->judul . '.',
            '/dashboard-admin/materials',
            ['icon' => '📄'],
            ['pid' => $userId, 'material_id' => (int) $material->pid, 'package_id' => (int) $material->package_id]
        );

        (new AdminNotificationService())->logUserActivity(
            (int) $userId,
            'material.viewed',
            'Membuka materi',
            'Anda membuka materi ' . $material->judul . '.',
            '📄',
            ['material_id' => (int) $material->pid, 'package_id' => (int) $material->package_id]
        );

        return response()->stream(function () use ($stream) {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, $headers);
    }
}
