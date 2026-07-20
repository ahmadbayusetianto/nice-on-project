<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Notifications\AdminActivityNotification;

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

function questionGroupLabel(mixed $group, string $questionType = 'SKD', array $groupsById = []): string
{
    if (normalizeQuestionType($questionType) === 'SKD') {
        return match ((int) $group) {
            1 => 'TWK',
            2 => 'TIU',
            3 => 'TKP',
            default => 'Unknown',
        };
    }

    return $groupsById[(int) $group] ?? 'Unknown';
}

/**
 * The question_group a request selects must actually belong to the request's
 * question_type — and, for SKB, to the request's package_id too, since SKB
 * groups are scoped per package.
 */
function questionGroupValidationRule(string $questionType, mixed $packageId): \Illuminate\Validation\Rules\Exists
{
    return Rule::exists('tbl_question_groups', 'id')
        ->whereNull('deleted_at')
        ->where(function ($query) use ($questionType, $packageId) {
            if ($questionType === 'SKB') {
                $query->where('question_type', 'SKB')->where('package_id', $packageId);
            } else {
                $query->where('question_type', 'SKD');
            }
        });
}

/**
 * Build an {id => name} lookup for a set of question_group ids, for
 * resolving question_group_label without an N+1 query per row.
 */
function questionGroupNamesByIds(array $groupIds): array
{
    $groupIds = array_values(array_unique(array_filter($groupIds, fn ($id) => $id !== null && $id !== '')));

    if (empty($groupIds)) {
        return [];
    }

    return DB::table('tbl_question_groups')
        ->whereIn('id', $groupIds)
        ->pluck('name', 'id')
        ->all();
}

function isTkpQuestionGroup(mixed $group, string $questionType = 'SKD'): bool
{
    return normalizeQuestionType($questionType) === 'SKD' && (int) $group === 3;
}

/**
 * SKB packages (ref_paket rows) only ever need one question group, so the
 * admin never picks/manages it — find the existing one or create it silently.
 */
function resolveSkbQuestionGroupId(int $refPaketId, string $paketName): int
{
    $existing = DB::table('tbl_question_groups')
        ->where('package_id', $refPaketId)
        ->where('question_type', 'SKB')
        ->whereNull('deleted_at')
        ->first();

    if ($existing) {
        return (int) $existing->id;
    }

    $now = now();

    return DB::table('tbl_question_groups')->insertGetId([
        'package_id' => $refPaketId,
        'question_type' => 'SKB',
        'name' => $paketName,
        'sort_order' => 0,
        'is_locked' => false,
        'created_at' => $now,
        'updated_at' => null,
        'deleted_at' => null,
    ]);
}

function normalizeQuestionType(string $type): string
{
    $normalized = strtoupper(trim($type));

    if ($normalized === 'SINGLE') {
        return 'SKD';
    }

    if (in_array($normalized, ['SKD', 'SKB'], true)) {
        return $normalized;
    }

    return 'SKD';
}

function normalizeTryoutType(string $type): string
{
    $normalized = strtoupper(trim($type));

    if (in_array($normalized, ['SKD', 'SKB'], true)) {
        return $normalized;
    }

    return 'SKD';
}

function questionImageMaxUploadKb(): int
{
    return 2048;
}

function buildQuestionImageUrl(?Request $request, ?string $path): ?string
{
    if (empty($path) || !$request) {
        return null;
    }

    return $request->getSchemeAndHttpHost() . '/storage/' . ltrim($path, '/');
}

function storeUploadedQuestionImage(\Illuminate\Http\UploadedFile $file, string $folder): string
{
    $extension = strtolower($file->getClientOriginalExtension() ?: ($file->extension() ?: 'jpg'));
    $filename = Str::uuid()->toString() . '.' . $extension;

    return Storage::disk('public')->putFileAs($folder, $file, $filename);
}

function mapQuestionOptionRow(object $item, ?Request $request = null): array
{
    return [
        'id' => (int) $item->id,
        'question_id' => (int) $item->question_id,
        'choise' => (string) $item->choise,
        'answer' => (int) ($item->answer ?? 0) === 1,
        'istext' => (int) ($item->istext ?? 1) === 1,
        'nilai_tkp' => isset($item->nilai_tkp) && $item->nilai_tkp !== null ? (int) $item->nilai_tkp : null,
        'image_path' => $item->image_path ?? null,
        'image_url' => buildQuestionImageUrl($request, $item->image_path ?? null),
        'deleted_at' => $item->deleted_at ?? null,
    ];
}

function mapQuestionRow(object $item, ?array $options = null, ?Request $request = null, array $groupsById = []): array
{
    $type = normalizeQuestionType((string) ($item->question_type ?? 'SKD'));
    $group = (int) ($item->question_group ?? 0);

    return [
        'id' => (int) $item->id,
        'question' => (string) $item->question,
        'question_type' => $type,
        'question_group' => $group,
        'question_group_label' => questionGroupLabel($group, $type, $groupsById),
        'package_id' => isset($item->package_id) && $item->package_id !== null ? (int) $item->package_id : null,
        'package_name' => $item->package_name ?? null,
        'istext' => (int) ($item->istext ?? 1) === 1,
        'information' => $item->information,
        'pembahasan' => $item->pembahasan,
        'image_path' => $item->image_path ?? null,
        'image_url' => buildQuestionImageUrl($request, $item->image_path ?? null),
        'created_at' => $item->created_at ?? null,
        'updated_at' => $item->updated_at ?? null,
        'deleted_at' => $item->deleted_at ?? null,
        'options' => $options ?? [],
    ];
}

function parameterValueByCode(string $code, mixed $default = null): mixed
{
    if (!Schema::hasTable('tbl_parameter')) {
        return $default;
    }

    $item = DB::table('tbl_parameter')
        ->where('kode', $code)
        ->where('is_active', 1)
        ->first();

    return $item ? $item->nilai : $default;
}

function parameterIntValue(string $code, int $default): int
{
    return (int) parameterValueByCode($code, $default);
}

function resolveAdminUsers(): \Illuminate\Support\Collection
{
    if (!Schema::hasTable('tbl_user')) {
        return collect();
    }

    return User::query()
        ->where('is_admin', 1)
        ->where('status', 'active')
        ->get();
}

function notifyAdminUsers(string $type, string $title, string $message, ?string $url = null, array $meta = [], ?array $actor = null): void
{
    $adminUsers = resolveAdminUsers();

    if ($adminUsers->isEmpty()) {
        return;
    }

    $payload = [
        'type' => $type,
        'title' => $title,
        'message' => $message,
        'url' => $url,
        'icon' => $meta['icon'] ?? '🔔',
        'meta' => $meta,
        'actor' => $actor,
    ];

    Notification::send($adminUsers, new AdminActivityNotification($payload));
}

function mapAdminNotification(object $notification): array
{
    $rawData = $notification->data ?? [];

    if (is_string($rawData)) {
        $data = json_decode($rawData, true) ?: [];
    } elseif (is_array($rawData)) {
        $data = $rawData;
    } elseif ($rawData instanceof \JsonSerializable) {
        $data = (array) $rawData->jsonSerialize();
    } else {
        $data = (array) $rawData;
    }

    return [
        'id' => (string) $notification->id,
        'type' => (string) ($data['type'] ?? $notification->type ?? 'activity'),
        'title' => (string) ($data['title'] ?? 'Notifikasi'),
        'message' => (string) ($data['message'] ?? ''),
        'icon' => (string) ($data['icon'] ?? '🔔'),
        'url' => $data['url'] ?? null,
        'meta' => $data['meta'] ?? [],
        'actor' => $data['actor'] ?? null,
        'read_at' => $notification->read_at ?? null,
        'is_read' => $notification->read_at !== null,
        'created_at' => $notification->created_at ?? null,
        'created_at_human' => !empty($notification->created_at) ? Carbon::parse($notification->created_at)->diffForHumans() : null,
    ];
}

function adminNotificationTableMissingResponse()
{
    return response()->json([
        'message' => 'Tabel notifications belum tersedia. Jalankan migrasi database terlebih dahulu.',
        'summary' => [
            'total_notifications' => 0,
            'unread_notifications' => 0,
        ],
        'data' => [],
    ], 503);
}

function parameterBoolValue(string $code, bool $default): bool
{
    $value = parameterValueByCode($code, $default ? '1' : '0');

    return filter_var($value, FILTER_VALIDATE_BOOL);
}

function mapTryoutOptionRow(object $item, ?Request $request = null): array
{
    return [
        'id' => (int) $item->id,
        'question_id' => (int) $item->question_id,
        'choise' => (string) $item->choise,
        'istext' => (int) ($item->istext ?? 1) === 1,
        'image_path' => $item->image_path ?? null,
        'image_url' => buildQuestionImageUrl($request, $item->image_path ?? null),
    ];
}

function mapTryoutQuestionRow(object $question, array $options, ?object $sheet = null, bool $includeResult = false, array $groupsById = [], ?Request $request = null): array
{
    $type = normalizeQuestionType((string) ($question->question_type ?? 'SKD'));
    $group = (int) ($question->question_group ?? 0);
    $selectedOptionId = $sheet ? (int) ($sheet->option_id ?? 0) : null;
    $isTkpGroup = isTkpQuestionGroup($group, $type);

    return [
        'id' => (int) $question->id,
        'question' => (string) $question->question,
        'question_type' => $type,
        'question_group' => $group,
        'question_group_label' => questionGroupLabel($group, $type, $groupsById),
        'istext' => (int) ($question->istext ?? 1) === 1,
        'information' => $question->information,
        'pembahasan' => $includeResult ? $question->pembahasan : null,
        'image_path' => $question->image_path ?? null,
        'image_url' => buildQuestionImageUrl($request, $question->image_path ?? null),
        'options' => $options,
        'selected_option_id' => $selectedOptionId ?: null,
        'answered' => $selectedOptionId ? true : false,
        'is_correct' => $includeResult && !$isTkpGroup ? (
            $selectedOptionId !== null && (int) $selectedOptionId === (int) ($sheet->answer_id ?? 0)
        ) : null,
        'correct_option_id' => $includeResult && !$isTkpGroup && !empty($sheet->answer_id) ? (int) $sheet->answer_id : null,
        'score_obtained' => $includeResult && $isTkpGroup ? (int) ($sheet->value ?? 0) : null,
    ];
}

function buildTryoutSessionPayload(int $ljkId, bool $includeResult = false, ?Request $request = null): ?array
{
    $hasDraftColumn = Schema::hasColumn('tbl_tryout_session', 'is_draft');

    // Draft (sandbox) sessions store a ref_paket pid in package_id, real
    // sessions store a tbl_paket pid — join both and pick by is_draft so a
    // sandbox session never accidentally displays a coincidentally-matching
    // tbl_paket row's name/kategori/formasi/jadwal (ref_paket has none of
    // those besides nama_paket).
    $query = DB::table('tbl_tryout_session as l')
        ->leftJoin('tbl_paket as p', 'l.package_id', '=', 'p.pid');

    if ($hasDraftColumn) {
        $query->leftJoin('ref_paket as rp', 'l.package_id', '=', 'rp.pid');
    }

    $session = $query
        ->where('l.id', $ljkId)
        ->select([
            'l.id',
            'l.user_id',
            'l.package_id',
            'l.jenis_tryout',
            'l.skor_twk',
            'l.skor_tiu',
            'l.skor_tkp',
            'l.skor_total',
            'l.status',
            'l.keterangan',
            'l.finish_at',
            'l.created_at',
        ])
        ->when(
            $hasDraftColumn,
            fn ($query) => $query->addSelect([
                'l.is_draft',
                DB::raw('CASE WHEN l.is_draft = 1 THEN rp.nama_paket ELSE p.nama_paket END AS nama_paket'),
                DB::raw('CASE WHEN l.is_draft = 1 THEN NULL ELSE p.kategori END AS kategori'),
                DB::raw('CASE WHEN l.is_draft = 1 THEN NULL ELSE p.formasi END AS formasi'),
                DB::raw('CASE WHEN l.is_draft = 1 THEN NULL ELSE p.jadwal END AS jadwal'),
            ]),
            fn ($query) => $query->addSelect(['p.nama_paket', 'p.kategori', 'p.formasi', 'p.jadwal'])
        )
        ->first();

    if (!$session) {
        return null;
    }

    $tryoutType = normalizeTryoutType((string) ($session->jenis_tryout ?? 'SKD'));

    $durationMinutes = parameterIntValue('exam.default_duration', 100);
    $expiresAt = null;
    $startedAtTimestamp = null;
    $expiresAtTimestamp = null;

    if (!empty($session->created_at)) {
        try {
            $startedAt = Carbon::parse($session->created_at);
            $expiresAt = $startedAt->copy()->addMinutes($durationMinutes)->toDateTimeString();
            $startedAtTimestamp = $startedAt->timestamp;
            $expiresAtTimestamp = $startedAt->copy()->addMinutes($durationMinutes)->timestamp;
        } catch (Throwable $error) {
            $expiresAt = null;
        }
    }

    $sheetRows = DB::table('tbl_answer_sheet')
        ->where('ljk_id', $ljkId)
        ->orderBy('id')
        ->get();

    $questionIds = $sheetRows->pluck('question_id')->all();
    if (empty($questionIds)) {
        return null;
    }

    $questionsById = DB::table('tbl_questions')
        ->select([
            'id',
            'question',
            'question_type',
            'question_group',
            'istext',
            'information',
            'pembahasan',
            'image_path',
        ])
        ->whereIn('id', $questionIds)
        ->get()
        ->keyBy('id');

    $optionsByQuestion = DB::table('tbl_question_options')
        ->select([
            'id',
            'question_id',
            'choise',
            'istext',
            'image_path',
        ])
        ->whereIn('question_id', $questionIds)
        ->whereNull('deleted_at')
        ->orderBy('id')
        ->get()
        ->groupBy('question_id');

    $groupsById = questionGroupNamesByIds($questionsById->pluck('question_group')->all());

    $questions = $sheetRows->map(function ($sheet) use ($questionsById, $optionsByQuestion, $includeResult, $groupsById, $request) {
        $question = $questionsById[(int) $sheet->question_id] ?? null;
        if (!$question) {
            return null;
        }

        $options = ($optionsByQuestion[(int) $sheet->question_id] ?? collect())
            ->map(fn ($option) => mapTryoutOptionRow($option, $request))
            ->values()
            ->all();

        return mapTryoutQuestionRow($question, $options, $sheet, $includeResult, $groupsById, $request);
    })->filter()->values();

    return [
        'session' => [
            'id' => (int) $session->id,
            'user_id' => (int) $session->user_id,
            'package_id' => $session->package_id ? (int) $session->package_id : null,
            'jenis_tryout' => $tryoutType,
            'package_name' => $session->nama_paket ?? $session->keterangan ?? 'Tryout',
            'package_category' => $session->kategori ?? null,
            'package_formasi' => $session->formasi ?? null,
            'package_jadwal' => $session->jadwal ?? null,
            'score_twk' => (int) ($session->skor_twk ?? 0),
            'score_tiu' => (int) ($session->skor_tiu ?? 0),
            'score_tkp' => (int) ($session->skor_tkp ?? 0),
            'score_total' => (int) ($session->skor_total ?? 0),
            'status' => (int) ($session->status ?? 0),
            'is_draft' => $hasDraftColumn ? (int) ($session->is_draft ?? 0) === 1 : false,
            'is_finished' => (int) ($session->status ?? 0) === 1,
            'finish_at' => $session->finish_at ?? null,
            'created_at' => $session->created_at ?? null,
            'started_at_timestamp' => $startedAtTimestamp,
            'expires_at_timestamp' => $expiresAtTimestamp,
        ],
        'questions' => $questions,
        'settings' => [
            'duration_minutes' => $durationMinutes,
            'expires_at' => $expiresAt,
            'auto_submit' => parameterBoolValue('exam.auto_submit', true),
            'shuffle_question' => parameterBoolValue('exam.shuffle_question', true),
            'shuffle_option' => parameterBoolValue('exam.shuffle_option', true),
        ],
    ];
}

function createTryoutSessionRecord(array $validated, object $package, $selectedQuestions, $now, string $tryoutType, bool $isDraft = false): int
{
    $hasDraftColumn = Schema::hasColumn('tbl_tryout_session', 'is_draft');

    $ljkId = DB::table('tbl_tryout_session')->insertGetId([
        'user_id' => $validated['user_id'],
        'package_id' => $validated['package_id'],
        'jenis_tryout' => $tryoutType,
        'skor_twk' => 0,
        'skor_tiu' => 0,
        'skor_tkp' => 0,
        'skor_total' => 0,
        'status' => 0,
        'keterangan' => $package->nama_paket,
        'finish_at' => null,
        'created_at' => $now,
        'updated_at' => null,
    ] + ($hasDraftColumn ? ['is_draft' => $isDraft ? 1 : 0] : []));

    foreach ($selectedQuestions as $question) {
        $answerOption = DB::table('tbl_question_options')
            ->where('question_id', $question->id)
            ->whereNull('deleted_at')
            ->where('answer', 1)
            ->orderBy('id')
            ->first();

        DB::table('tbl_answer_sheet')->insert([
            'ljk_id' => $ljkId,
            'question_id' => $question->id,
            'question_group' => $tryoutType === 'SKD' ? (string) (int) $question->question_group : (string) $question->question_group,
            'option_id' => null,
            'answer_id' => $answerOption?->id,
            'value' => null,
        ]);
    }

    return (int) $ljkId;
}

function calculateTryoutSheetValue(?int $selectedOptionId, ?int $answerOptionId, mixed $questionGroup = 1, string $questionType = 'SKD'): int
{
    if (isTkpQuestionGroup($questionGroup, $questionType)) {
        if (!$selectedOptionId) {
            return 0;
        }

        $selectedOption = DB::table('tbl_question_options')
            ->where('id', $selectedOptionId)
            ->first();

        return (int) ($selectedOption->nilai_tkp ?? 0);
    }

    $scoreCorrect = parameterIntValue('exam.score_correct', 5);
    $scoreWrong = parameterIntValue('exam.score_wrong', 0);
    $scoreBlank = parameterIntValue('exam.score_blank', 0);

    if (!$selectedOptionId) {
        return $scoreBlank;
    }

    return (int) $selectedOptionId === (int) $answerOptionId ? $scoreCorrect : $scoreWrong;
}

function formatMaterialFileSize(int $bytes): string
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

function mapMaterialRow(object $item): array
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
        'file_size_label' => formatMaterialFileSize((int) ($item->file_size ?? 0)),
        'sort_order' => (int) ($item->sort_order ?? 0),
        'is_published' => $isPublished,
        'status' => $isPublished ? 'Terbit' : 'Draft',
        'status_key' => $isPublished ? 'published' : 'draft',
        'created_at' => $item->created_at ?? null,
        'updated_at' => $item->updated_at ?? null,
        'deleted_at' => $item->deleted_at ?? null,
    ];
}

function materialTableMissingResponse()
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

function materialMaxUploadKb(): int
{
    return max(1, parameterIntValue('system.max_upload_size', 5)) * 1024;
}

function userPurchasedPackageIds(?int $userId): array
{
    if (!$userId || !Schema::hasTable('tbl_transaksi')) {
        return [];
    }

    return DB::table('tbl_transaksi')
        ->where('pid_user', $userId)
        ->where('status_transaksi', 'paid')
        ->pluck('pid_paket')
        ->filter()
        ->map(fn ($packageId) => (int) $packageId)
        ->unique()
        ->values()
        ->all();
}

function userHasMaterialAccess(?int $userId, int $packageId): bool
{
    if (!$userId) {
        return false;
    }

    return in_array($packageId, userPurchasedPackageIds($userId), true);
}

function materialStoredPath(string $filename): string
{
    return 'materials/'.$filename;
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
    $userAktif = (int) DB::table('tbl_user')->where('status', 'active')->count();
    $userNonaktif = (int) DB::table('tbl_user')->where('status', 'inactive')->count();
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
            'user_aktif' => $userAktif,
            'user_nonaktif' => $userNonaktif,
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

Route::post('/admin/users', function (Request $request) {
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
});

Route::patch('/admin/users/{pid}/toggle-role', function ($pid) {
    $user = DB::table('tbl_user')->where('pid', $pid)->first();

    if (!$user) {
        return response()->json([
            'message' => 'User tidak ditemukan.',
        ], 404);
    }

    $currentIsAdmin = (int) ($user->is_admin ?? 0) === 1;

    if ($currentIsAdmin) {
        $adminCount = (int) DB::table('tbl_user')->where('is_admin', 1)->count();

        if ($adminCount <= 1) {
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
});

Route::get('/admin/users/{pid}', function ($pid) {
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
});

Route::put('/admin/users/{pid}', function (Request $request, $pid) {
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

    if ((int) ($user->is_admin ?? 0) === 1 && $nextIsAdmin === 0) {
        $adminCount = (int) DB::table('tbl_user')->where('is_admin', 1)->count();
        if ($adminCount <= 1) {
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

Route::get('/tryout/current', function (Request $request) {
    $userId = (int) $request->query('user_id', 0);
    $includeDraft = filter_var($request->query('include_draft', false), FILTER_VALIDATE_BOOL);
    $hasDraftColumn = Schema::hasColumn('tbl_tryout_session', 'is_draft');

    if ($userId <= 0) {
        return response()->json([
            'message' => 'User tidak valid.',
        ], 422);
    }

    $session = DB::table('tbl_tryout_session')
        ->where('user_id', $userId)
        ->where('status', 0)
        ->when(!$includeDraft && $hasDraftColumn, function ($query) {
            $query->where(function ($draftQuery) {
                $draftQuery->whereNull('is_draft')->orWhere('is_draft', 0);
            });
        })
        ->orderByDesc('created_at')
        ->first();

    if (!$session) {
        return response()->json([
            'message' => 'Tidak ada sesi tryout aktif.',
        ], 404);
    }

    $payload = buildTryoutSessionPayload((int) $session->id, false, $request);

    if (!$payload) {
        return response()->json([
            'message' => 'Sesi tryout aktif tidak dapat dimuat.',
        ], 404);
    }

    return response()->json([
        'message' => 'Sesi tryout aktif ditemukan.',
        'data' => $payload,
    ]);
});

Route::post('/tryout/start', function (Request $request) {
    $input = [
        'user_id' => $request->input('user_id', $request->input('pid_user')),
        'package_id' => $request->input('package_id', $request->input('pid_paket')),
        'jenis_tryout' => $request->input('jenis_tryout', $request->input('type', 'SKD')),
    ];

    $validator = Validator::make($input, [
        'user_id' => ['required', 'integer', 'exists:tbl_user,pid'],
        'package_id' => ['required', 'integer', 'exists:tbl_paket,pid'],
        'jenis_tryout' => ['required', 'string', 'in:SKD,SKB,skd,skb'],
    ], [
        'user_id.required' => 'User wajib dipilih.',
        'user_id.exists' => 'User tidak ditemukan.',
        'package_id.required' => 'Paket tryout wajib dipilih.',
        'package_id.exists' => 'Paket tidak ditemukan.',
        'jenis_tryout.required' => 'Jenis tryout wajib dipilih.',
        'jenis_tryout.in' => 'Jenis tryout tidak valid.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi tryout gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();
    $tryoutType = normalizeTryoutType((string) $validated['jenis_tryout']);

    $package = DB::table('tbl_paket')
        ->where('pid', $validated['package_id'])
        ->whereNull('deleted_at')
        ->first();

    if (!$package) {
        return response()->json(['message' => 'Paket tidak ditemukan.'], 404);
    }

    $shuffleQuestion = parameterBoolValue('exam.shuffle_question', true);
    $selectedQuestions = collect();
    $questionsQuery = DB::table('tbl_questions')
        ->select(['id', 'question_group'])
        ->where('package_id', $validated['package_id'])
        ->whereNull('deleted_at');

    if ($tryoutType === 'SKD') {
        $questionsQuery->whereIn('question_type', ['SKD', 'single']);
    } else {
        $questionsQuery->where('question_type', 'SKB');
    }

    $questionsByGroup = $questionsQuery
        ->orderBy('question_group')
        ->orderBy('id')
        ->get()
        ->groupBy('question_group');

    if ($tryoutType === 'SKD') {
        $groupQuotas = [
            1 => parameterIntValue('catcpns.twk_default', 30),
            2 => parameterIntValue('catcpns.tiu_default', 35),
            3 => parameterIntValue('catcpns.tkp_default', 45),
        ];

        foreach ($groupQuotas as $group => $quota) {
            $groupQuestions = collect($questionsByGroup->get((string) $group, []));
            if ($groupQuestions->isEmpty()) {
                continue;
            }

            $limit = $quota > 0 ? min($quota, $groupQuestions->count()) : $groupQuestions->count();
            $selectedQuestions = $selectedQuestions->merge($groupQuestions->take($limit)->values());
        }
    } else {
        // SKB groups are admin-defined free text with no fixed taxonomy/quota —
        // take every SKB question found for this package, across all groups.
        foreach ($questionsByGroup as $groupQuestions) {
            $selectedQuestions = $selectedQuestions->merge(collect($groupQuestions)->values());
        }
    }

    if ($shuffleQuestion) {
        $selectedQuestions = $selectedQuestions->shuffle()->values();
    }

    if ($selectedQuestions->isEmpty()) {
        return response()->json(['message' => 'Bank soal untuk paket ini masih kosong.'], 422);
    }

    $now = now();
    $ljkId = DB::transaction(function () use ($validated, $package, $selectedQuestions, $now, $tryoutType) {
        return createTryoutSessionRecord($validated, $package, $selectedQuestions, $now, $tryoutType, false);
    });

    $user = DB::table('tbl_user')->where('pid', $validated['user_id'])->first();
    notifyAdminUsers(
        'tryout.started',
        'Tryout dimulai',
        'User ' . ($user->email ?? ('#' . $validated['user_id'])) . ' memulai tryout ' . $package->nama_paket . '.',
        '/dashboard-admin/transactions',
        ['icon' => '📝'],
        ['pid' => (int) $validated['user_id'], 'package_id' => (int) $validated['package_id'], 'jenis_tryout' => $tryoutType]
    );

    $payload = buildTryoutSessionPayload($ljkId, false, $request);

    return response()->json([
        'message' => 'Tryout berhasil dimulai.',
        'data' => $payload,
    ], 201);
});

Route::post('/admin/tryout-sandbox/start', function (Request $request) {
    $input = [
        'user_id' => $request->input('user_id', $request->input('pid_user')),
        'package_id' => $request->input('package_id', $request->input('pid_paket')),
        'jenis_tryout' => $request->input('jenis_tryout', $request->input('type', 'SKD')),
    ];

    $validator = Validator::make($input, [
        'user_id' => ['required', 'integer', 'exists:tbl_user,pid'],
        'package_id' => ['required', 'integer', 'exists:ref_paket,pid'],
        'jenis_tryout' => ['required', 'string', 'in:SKD,SKB,skd,skb'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi sandbox gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();
    $tryoutType = normalizeTryoutType((string) $validated['jenis_tryout']);

    $package = DB::table('ref_paket')
        ->where('pid', $validated['package_id'])
        ->whereNull('deleted_at')
        ->first();

    if (!$package) {
        return response()->json(['message' => 'Paket tidak ditemukan.'], 404);
    }

    $shuffleQuestion = parameterBoolValue('exam.shuffle_question', true);
    $selectedQuestions = collect();
    $questionsQuery = DB::table('tbl_questions')
        ->select(['id', 'question_group'])
        ->where('package_id', $validated['package_id'])
        ->whereNull('deleted_at');

    if ($tryoutType === 'SKD') {
        $questionsQuery->whereIn('question_type', ['SKD', 'single']);
    } else {
        $questionsQuery->where('question_type', 'SKB');
    }

    $questionsByGroup = $questionsQuery
        ->orderBy('question_group')
        ->orderBy('id')
        ->get()
        ->groupBy('question_group');

    if ($tryoutType === 'SKD') {
        $groupQuotas = [
            1 => parameterIntValue('catcpns.twk_default', 30),
            2 => parameterIntValue('catcpns.tiu_default', 35),
            3 => parameterIntValue('catcpns.tkp_default', 45),
        ];

        foreach ($groupQuotas as $group => $quota) {
            $groupQuestions = collect($questionsByGroup->get((string) $group, []));
            if ($groupQuestions->isEmpty()) {
                continue;
            }

            $limit = $quota > 0 ? min($quota, $groupQuestions->count()) : $groupQuestions->count();
            $selectedQuestions = $selectedQuestions->merge($groupQuestions->take($limit)->values());
        }
    } else {
        // SKB groups are admin-defined free text with no fixed taxonomy/quota —
        // take every SKB question found for this package, across all groups.
        foreach ($questionsByGroup as $groupQuestions) {
            $selectedQuestions = $selectedQuestions->merge(collect($groupQuestions)->values());
        }
    }

    if ($shuffleQuestion) {
        $selectedQuestions = $selectedQuestions->shuffle()->values();
    }

    if ($selectedQuestions->isEmpty()) {
        return response()->json(['message' => 'Bank soal untuk paket ini masih kosong.'], 422);
    }

    $now = now();
    $ljkId = DB::transaction(function () use ($validated, $package, $selectedQuestions, $now, $tryoutType) {
        return createTryoutSessionRecord($validated, $package, $selectedQuestions, $now, $tryoutType, true);
    });

    $payload = buildTryoutSessionPayload($ljkId, false, $request);

    return response()->json([
        'message' => 'Sandbox tryout berhasil dibuat.',
        'data' => $payload,
    ], 201);
});

Route::get('/tryout/{ljkId}', function (Request $request, $ljkId) {
    $userId = (int) $request->query('user_id', 0);
    $session = DB::table('tbl_tryout_session')
        ->where('id', $ljkId)
        ->first();

    if (!$session || ($userId > 0 && (int) $session->user_id !== $userId)) {
        return response()->json(['message' => 'Sesi tryout tidak ditemukan.'], 404);
    }

    $payload = buildTryoutSessionPayload((int) $session->id, (int) ($session->status ?? 0) === 1, $request);

    if (!$payload) {
        return response()->json(['message' => 'Sesi tryout tidak ditemukan.'], 404);
    }

    return response()->json([
        'message' => 'Sesi tryout berhasil dimuat.',
        'data' => $payload,
    ]);
});

Route::put('/tryout/{ljkId}/answer', function (Request $request, $ljkId) {
    $input = [
        'user_id' => $request->input('user_id', $request->input('pid_user')),
        'question_id' => $request->input('question_id'),
        'option_id' => $request->input('option_id'),
    ];

    $validator = Validator::make($input, [
        'user_id' => ['required', 'integer', 'exists:tbl_user,pid'],
        'question_id' => ['required', 'integer', 'exists:tbl_questions,id'],
        'option_id' => ['nullable', 'integer', 'exists:tbl_question_options,id'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi jawaban gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $session = DB::table('tbl_tryout_session')
        ->where('id', $ljkId)
        ->where('user_id', $input['user_id'])
        ->first();

    if (!$session) {
        return response()->json(['message' => 'Sesi tryout tidak ditemukan.'], 404);
    }

    if ((int) ($session->status ?? 0) === 1) {
        return response()->json(['message' => 'Sesi tryout sudah selesai.'], 409);
    }

    $sheet = DB::table('tbl_answer_sheet')
        ->where('ljk_id', $ljkId)
        ->where('question_id', $input['question_id'])
        ->first();

    if (!$sheet) {
        return response()->json(['message' => 'Soal tidak ditemukan pada sesi ini.'], 404);
    }

    if (!empty($input['option_id'])) {
        $optionExists = DB::table('tbl_question_options')
            ->where('id', $input['option_id'])
            ->where('question_id', $input['question_id'])
            ->whereNull('deleted_at')
            ->exists();

        if (!$optionExists) {
            return response()->json(['message' => 'Opsi jawaban tidak valid.'], 422);
        }
    }

    $selectedOptionId = !empty($input['option_id']) ? (int) $input['option_id'] : null;
    $answerOptionId = $sheet->answer_id ? (int) $sheet->answer_id : null;

    DB::table('tbl_answer_sheet')
        ->where('id', $sheet->id)
        ->update([
            'option_id' => $selectedOptionId,
            'value' => calculateTryoutSheetValue($selectedOptionId, $answerOptionId, $sheet->question_group ?? 1, normalizeTryoutType((string) ($session->jenis_tryout ?? 'SKD'))),
        ]);

    return response()->json([
        'message' => 'Jawaban berhasil disimpan.',
    ]);
});

Route::post('/tryout/{ljkId}/finish', function (Request $request, $ljkId) {
    $userId = (int) $request->input('user_id', $request->input('pid_user'));

    if ($userId <= 0) {
        return response()->json(['message' => 'User tidak valid.'], 422);
    }

    $session = DB::table('tbl_tryout_session')
        ->where('id', $ljkId)
        ->where('user_id', $userId)
        ->first();

    if (!$session) {
        return response()->json(['message' => 'Sesi tryout tidak ditemukan.'], 404);
    }

    if ((int) ($session->status ?? 0) === 1) {
        $payload = buildTryoutSessionPayload((int) $session->id, true, $request);
        return response()->json([
            'message' => 'Sesi tryout sudah selesai.',
            'data' => $payload,
        ]);
    }

    $sheetRows = DB::table('tbl_answer_sheet')
        ->where('ljk_id', $ljkId)
        ->orderBy('id')
        ->get();

    if ($sheetRows->isEmpty()) {
        return response()->json(['message' => 'Sesi tryout tidak memiliki soal.'], 422);
    }

    $tryoutType = normalizeTryoutType((string) ($session->jenis_tryout ?? 'SKD'));
    $scoreTwk = 0;
    $scoreTiu = 0;
    $scoreTkp = 0;
    $scoreOther = 0;
    $now = now();

    DB::transaction(function () use ($sheetRows, $ljkId, $now, $tryoutType, &$scoreTwk, &$scoreTiu, &$scoreTkp, &$scoreOther) {
        foreach ($sheetRows as $sheet) {
            $rawGroup = $sheet->question_group ?? 1;
            $selectedOptionId = $sheet->option_id ? (int) $sheet->option_id : null;
            $answerOptionId = $sheet->answer_id ? (int) $sheet->answer_id : null;
            $value = calculateTryoutSheetValue($selectedOptionId, $answerOptionId, $rawGroup, $tryoutType);

            DB::table('tbl_answer_sheet')
                ->where('id', $sheet->id)
                ->update([
                    'value' => $value,
                ]);

            if ($tryoutType !== 'SKD') {
                // SKB groups are admin-defined free text with no TWK/TIU/TKP taxonomy.
                $scoreOther += $value;
                continue;
            }

            $questionGroup = (int) $rawGroup;
            if ($questionGroup === 1) {
                $scoreTwk += $value;
            } elseif ($questionGroup === 2) {
                $scoreTiu += $value;
            } elseif ($questionGroup === 3) {
                $scoreTkp += $value;
            }
        }

        DB::table('tbl_tryout_session')
            ->where('id', $ljkId)
            ->update([
                'skor_twk' => $scoreTwk,
                'skor_tiu' => $scoreTiu,
                'skor_tkp' => $scoreTkp,
                'skor_total' => $scoreTwk + $scoreTiu + $scoreTkp + $scoreOther,
                'status' => 1,
                'finish_at' => $now,
                'updated_at' => $now,
            ]);
    });

    $payload = buildTryoutSessionPayload((int) $ljkId, true, $request);

    $user = DB::table('tbl_user')->where('pid', $userId)->first();
    if ((int) ($session->is_draft ?? 0) !== 1) {
        notifyAdminUsers(
            'tryout.finished',
            'Tryout selesai',
            'User ' . ($user->email ?? ('#' . $userId)) . ' menyelesaikan tryout dengan skor ' . ($scoreTwk + $scoreTiu + $scoreTkp + $scoreOther) . '.',
            '/dashboard-admin/transactions',
            ['icon' => '🏁'],
            ['pid' => $userId, 'session_id' => (int) $ljkId, 'score_total' => $scoreTwk + $scoreTiu + $scoreTkp + $scoreOther]
        );
    }

    return response()->json([
        'message' => 'Tryout selesai dan skor berhasil dihitung.',
        'data' => $payload,
    ]);
});

Route::get('/admin/questions', function (Request $request) {
    $group = trim((string) $request->query('group', ''));
    $type = trim((string) $request->query('type', ''));
    $search = trim((string) $request->query('search', ''));
    $includeTrashed = filter_var($request->query('include_trashed', false), FILTER_VALIDATE_BOOL);

    $query = DB::table('tbl_questions as q')
        ->leftJoin('ref_paket as p', 'q.package_id', '=', 'p.pid')
        ->select([
            'q.id',
            'q.question',
            'q.question_type',
            'q.question_group',
            'q.package_id',
            'p.nama_paket as package_name',
            'q.istext',
            'q.information',
            'q.pembahasan',
            'q.image_path',
            'q.created_at',
            'q.updated_at',
            'q.deleted_at',
        ])
        ->orderByDesc('q.created_at')
        ->orderByDesc('q.id');

    if (!$includeTrashed) {
        $query->whereNull('q.deleted_at');
    }

    if ($group !== '' && ctype_digit($group)) {
        $query->where('q.question_group', (int) $group);
    }

    if ($type !== '') {
        $normalizedType = normalizeQuestionType($type);

        if ($normalizedType === 'SKD') {
          $query->whereIn('q.question_type', ['SKD', 'single']);
        } else {
          $query->where('q.question_type', $normalizedType);
        }
    }

    if ($search !== '') {
        $query->where('q.question', 'like', "%{$search}%");
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
                'nilai_tkp',
                'image_path',
                'deleted_at',
            ])
            ->whereIn('question_id', $questionIds)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();

        foreach ($options as $option) {
            $optionsByQuestion[(int) $option->question_id] ??= [];
            $optionsByQuestion[(int) $option->question_id][] = mapQuestionOptionRow($option, $request);
        }
    }

    $groupsById = questionGroupNamesByIds($questions->pluck('question_group')->all());

    $data = $questions->map(function ($item) use ($optionsByQuestion, $request, $groupsById) {
        $options = $optionsByQuestion[(int) $item->id] ?? [];
        $correctCount = count(array_filter($options, fn ($option) => (bool) ($option['answer'] ?? false)));

        return array_merge(mapQuestionRow($item, $options, $request, $groupsById), [
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

Route::get('/admin/questions/{id}', function (Request $request, $id) {
    $question = DB::table('tbl_questions as q')
        ->leftJoin('ref_paket as p', 'q.package_id', '=', 'p.pid')
        ->select([
            'q.id',
            'q.question',
            'q.question_type',
            'q.question_group',
            'q.package_id',
            'p.nama_paket as package_name',
            'q.istext',
            'q.information',
            'q.pembahasan',
            'q.image_path',
            'q.created_at',
            'q.updated_at',
            'q.deleted_at',
        ])
        ->where('q.id', $id)
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
            'nilai_tkp',
            'image_path',
            'deleted_at',
        ])
        ->where('question_id', $id)
        ->whereNull('deleted_at')
        ->orderBy('id')
        ->get()
        ->map(fn ($item) => mapQuestionOptionRow($item, $request))
        ->values();

    $groupsById = questionGroupNamesByIds([$question->question_group]);

    return response()->json([
        'message' => 'Detail soal berhasil dimuat.',
        'data' => array_merge(mapQuestionRow($question, $options->all(), $request, $groupsById), [
            'options_count' => $options->count(),
            'correct_options_count' => count(array_filter($options->all(), fn ($option) => (bool) ($option['answer'] ?? false))),
        ]),
    ]);
});

Route::post('/admin/questions', function (Request $request) {
    $isText = $request->boolean('istext');
    $questionTypeInput = normalizeQuestionType((string) $request->input('question_type', 'SKD'));

    $rules = [
        'question_type' => ['required', 'string', 'in:SKD,SKB,single,skd,skb'],
        'question_group' => $questionTypeInput === 'SKB'
            ? ['nullable', 'integer']
            : ['required', 'integer', questionGroupValidationRule($questionTypeInput, $request->input('package_id'))],
        'package_id' => ['required', 'integer', Rule::exists('ref_paket', 'pid')->whereNull('deleted_at')],
        'istext' => ['required', 'boolean'],
        'information' => ['nullable', 'string'],
        'pembahasan' => ['nullable', 'string'],
        'options' => ['required', 'array', 'min:1'],
        'options.*.answer' => ['nullable', 'boolean'],
        'options.*.istext' => ['nullable', 'boolean'],
        'options.*.nilai_tkp' => ['nullable', 'integer', 'min:1', 'max:5', 'required_if:question_group,3'],
    ];

    if ($isText) {
        $rules['question'] = ['required', 'string'];
        $rules['options.*.choise'] = ['required', 'string'];
    } else {
        $rules['question'] = ['nullable', 'string'];
        $rules['question_image'] = ['required', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()];
        $rules['options.*.choise'] = ['nullable', 'string'];
        $rules['options.*.image'] = ['required', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()];
    }

    $validator = Validator::make($request->all(), $rules, [
        'options.*.nilai_tkp.required_if' => 'Nilai TKP (1-5) wajib diisi untuk setiap opsi.',
        'options.*.nilai_tkp.min' => 'Nilai TKP minimal 1.',
        'options.*.nilai_tkp.max' => 'Nilai TKP maksimal 5.',
        'package_id.required' => 'Paket wajib dipilih.',
        'package_id.exists' => 'Paket tidak ditemukan.',
        'question_group.exists' => 'Grup soal tidak ditemukan untuk paket/tipe soal ini.',
        'question_image.required' => 'Gambar soal wajib diunggah.',
        'options.*.image.required' => 'Gambar wajib diunggah untuk setiap opsi jawaban.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi soal gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();
    $questionType = normalizeQuestionType((string) $validated['question_type']);

    if ($questionType === 'SKB') {
        $paketName = DB::table('ref_paket')->where('pid', $validated['package_id'])->value('nama_paket') ?? '';
        $validated['question_group'] = resolveSkbQuestionGroupId((int) $validated['package_id'], $paketName);
    }

    $isTkpGroup = isTkpQuestionGroup($validated['question_group'], $questionType);

    $questionImagePath = $isText ? null : storeUploadedQuestionImage($request->file('question_image'), 'questions');

    $normalizedOptions = collect($validated['options'])
        ->values()
        ->map(function ($option, $index) use ($isTkpGroup, $isText, $request) {
            return [
                'choise' => $isText ? trim((string) ($option['choise'] ?? '')) : '',
                'answer' => (int) filter_var($option['answer'] ?? false, FILTER_VALIDATE_BOOL) === 1,
                'istext' => $isText,
                'nilai_tkp' => $isTkpGroup && ($option['nilai_tkp'] ?? null) !== null && $option['nilai_tkp'] !== ''
                    ? (int) $option['nilai_tkp']
                    : null,
                'image_path' => $isText ? null : storeUploadedQuestionImage($request->file("options.$index.image"), 'question-options'),
            ];
        });

    if ($isText) {
        $normalizedOptions = $normalizedOptions->filter(fn ($option) => $option['choise'] !== '')->values();
    }

    if ($normalizedOptions->count() < 1) {
        return response()->json([
            'message' => 'Minimal 1 opsi wajib diisi.',
        ], 422);
    }

    if (!$isTkpGroup && $normalizedOptions->where('answer', true)->count() !== 1) {
        return response()->json([
            'message' => 'Harus ada tepat 1 jawaban benar.',
        ], 422);
    }

    $now = now();
    $questionId = DB::transaction(function () use ($validated, $normalizedOptions, $now, $questionType, $isText, $questionImagePath) {
        $questionId = DB::table('tbl_questions')->insertGetId([
            'question' => $isText ? $validated['question'] : '',
            'question_type' => $questionType,
            'question_group' => $validated['question_group'],
            'package_id' => $validated['package_id'],
            'istext' => (bool) $isText,
            'image_path' => $questionImagePath,
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
                'nilai_tkp' => $option['nilai_tkp'],
                'image_path' => $option['image_path'],
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
    $isText = $request->boolean('istext');
    $questionTypeInput = normalizeQuestionType((string) $request->input('question_type', 'SKD'));

    $rules = [
        'question_type' => ['required', 'string', 'in:SKD,SKB,single,skd,skb'],
        'question_group' => $questionTypeInput === 'SKB'
            ? ['nullable', 'integer']
            : ['required', 'integer', questionGroupValidationRule($questionTypeInput, $request->input('package_id'))],
        'package_id' => ['required', 'integer', Rule::exists('ref_paket', 'pid')->whereNull('deleted_at')],
        'istext' => ['required', 'boolean'],
        'information' => ['nullable', 'string'],
        'pembahasan' => ['nullable', 'string'],
        'options' => ['required', 'array', 'min:1'],
        'options.*.answer' => ['nullable', 'boolean'],
        'options.*.istext' => ['nullable', 'boolean'],
        'options.*.nilai_tkp' => ['nullable', 'integer', 'min:1', 'max:5', 'required_if:question_group,3'],
        'options.*.existing_image_path' => ['nullable', 'string'],
    ];

    if ($isText) {
        $rules['question'] = ['required', 'string'];
        $rules['options.*.choise'] = ['required', 'string'];
    } else {
        $rules['question'] = ['nullable', 'string'];
        $rules['question_image'] = ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()];
        $rules['existing_question_image_path'] = ['nullable', 'string'];
        $rules['options.*.choise'] = ['nullable', 'string'];
        $rules['options.*.image'] = ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()];
    }

    $validator = Validator::make($request->all(), $rules, [
        'options.*.nilai_tkp.required_if' => 'Nilai TKP (1-5) wajib diisi untuk setiap opsi.',
        'options.*.nilai_tkp.min' => 'Nilai TKP minimal 1.',
        'options.*.nilai_tkp.max' => 'Nilai TKP maksimal 5.',
        'package_id.required' => 'Paket wajib dipilih.',
        'package_id.exists' => 'Paket tidak ditemukan.',
        'question_group.exists' => 'Grup soal tidak ditemukan untuk paket/tipe soal ini.',
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
    $questionType = normalizeQuestionType((string) $validated['question_type']);

    if ($questionType === 'SKB') {
        $paketName = DB::table('ref_paket')->where('pid', $validated['package_id'])->value('nama_paket') ?? '';
        $validated['question_group'] = resolveSkbQuestionGroupId((int) $validated['package_id'], $paketName);
    }

    $isTkpGroup = isTkpQuestionGroup($validated['question_group'], $questionType);

    $questionImagePath = null;
    if (!$isText) {
        $uploadedQuestionImage = $request->file('question_image');
        $questionImagePath = $uploadedQuestionImage
            ? storeUploadedQuestionImage($uploadedQuestionImage, 'questions')
            : ($validated['existing_question_image_path'] ?? null);

        if (empty($questionImagePath)) {
            return response()->json([
                'message' => 'Gambar soal wajib diunggah.',
            ], 422);
        }
    }

    $normalizedOptions = collect($validated['options'])
        ->values()
        ->map(function ($option, $index) use ($isTkpGroup, $isText, $request) {
            $imagePath = null;
            if (!$isText) {
                $uploaded = $request->file("options.$index.image");
                $imagePath = $uploaded
                    ? storeUploadedQuestionImage($uploaded, 'question-options')
                    : ($option['existing_image_path'] ?? null);
            }

            return [
                'choise' => $isText ? trim((string) ($option['choise'] ?? '')) : '',
                'answer' => (int) filter_var($option['answer'] ?? false, FILTER_VALIDATE_BOOL) === 1,
                'istext' => $isText,
                'nilai_tkp' => $isTkpGroup && ($option['nilai_tkp'] ?? null) !== null && $option['nilai_tkp'] !== ''
                    ? (int) $option['nilai_tkp']
                    : null,
                'image_path' => $imagePath,
            ];
        });

    if ($isText) {
        $normalizedOptions = $normalizedOptions->filter(fn ($option) => $option['choise'] !== '')->values();
    } elseif ($normalizedOptions->contains(fn ($option) => empty($option['image_path']))) {
        return response()->json([
            'message' => 'Gambar wajib diunggah untuk setiap opsi jawaban.',
        ], 422);
    }

    if ($normalizedOptions->count() < 1) {
        return response()->json([
            'message' => 'Minimal 1 opsi wajib diisi.',
        ], 422);
    }

    if (!$isTkpGroup && $normalizedOptions->where('answer', true)->count() !== 1) {
        return response()->json([
            'message' => 'Harus ada tepat 1 jawaban benar.',
        ], 422);
    }

    DB::transaction(function () use ($id, $validated, $normalizedOptions, $questionType, $isText, $questionImagePath) {
        $now = now();

        DB::table('tbl_questions')
            ->where('id', $id)
            ->update([
                'question' => $isText ? $validated['question'] : '',
                'question_type' => $questionType,
                'question_group' => $validated['question_group'],
                'package_id' => $validated['package_id'],
                'istext' => (bool) $isText,
                'image_path' => $questionImagePath,
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
                'nilai_tkp' => $option['nilai_tkp'],
                'image_path' => $option['image_path'],
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

Route::get('/admin/question-groups', function (Request $request) {
    $type = normalizeQuestionType((string) $request->query('type', 'SKD'));
    $packageId = $request->query('package_id');

    $query = DB::table('tbl_question_groups')
        ->where('question_type', $type)
        ->whereNull('deleted_at')
        ->orderBy('sort_order')
        ->orderBy('id');

    if ($type === 'SKB') {
        if (!$packageId) {
            return response()->json([
                'message' => 'Grup soal berhasil dimuat.',
                'data' => [],
            ]);
        }

        $query->where('package_id', $packageId);
    } else {
        $query->whereNull('package_id');
    }

    $groups = $query->get()->map(fn ($item) => [
        'id' => (int) $item->id,
        'package_id' => $item->package_id !== null ? (int) $item->package_id : null,
        'question_type' => $item->question_type,
        'name' => $item->name,
        'sort_order' => (int) $item->sort_order,
        'is_locked' => (bool) $item->is_locked,
    ])->values();

    return response()->json([
        'message' => 'Grup soal berhasil dimuat.',
        'data' => $groups,
    ]);
});

Route::post('/admin/question-groups', function (Request $request) {
    $questionType = normalizeQuestionType((string) $request->input('question_type', 'SKB'));

    if ($questionType === 'SKD') {
        return response()->json([
            'message' => 'Grup SKD tidak dapat ditambahkan karena sudah baku (TWK/TIU/TKP).',
        ], 422);
    }

    $validator = Validator::make($request->all(), [
        'package_id' => ['required', 'integer', Rule::exists('tbl_paket', 'pid')->whereNull('deleted_at')],
        'name' => ['required', 'string', 'max:100'],
    ], [
        'package_id.required' => 'Paket wajib dipilih.',
        'package_id.exists' => 'Paket tidak ditemukan.',
        'name.required' => 'Nama grup wajib diisi.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi grup soal gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();
    $name = trim($validated['name']);

    $duplicate = DB::table('tbl_question_groups')
        ->where('package_id', $validated['package_id'])
        ->where('question_type', 'SKB')
        ->whereNull('deleted_at')
        ->whereRaw('LOWER(name) = ?', [strtolower($name)])
        ->exists();

    if ($duplicate) {
        return response()->json([
            'message' => 'Grup dengan nama tersebut sudah ada di paket ini.',
        ], 422);
    }

    $now = now();
    $groupId = DB::table('tbl_question_groups')->insertGetId([
        'package_id' => $validated['package_id'],
        'question_type' => 'SKB',
        'name' => $name,
        'sort_order' => 0,
        'is_locked' => false,
        'created_at' => $now,
        'updated_at' => null,
        'deleted_at' => null,
    ]);

    return response()->json([
        'message' => 'Grup soal berhasil ditambahkan.',
        'data' => [
            'id' => $groupId,
            'package_id' => (int) $validated['package_id'],
            'question_type' => 'SKB',
            'name' => $name,
            'sort_order' => 0,
            'is_locked' => false,
        ],
    ], 201);
});

Route::put('/admin/question-groups/{id}', function (Request $request, $id) {
    $group = DB::table('tbl_question_groups')
        ->where('id', $id)
        ->whereNull('deleted_at')
        ->first();

    if (!$group) {
        return response()->json(['message' => 'Grup soal tidak ditemukan.'], 404);
    }

    if ($group->is_locked) {
        return response()->json(['message' => 'Grup SKD sudah baku dan tidak dapat diubah.'], 422);
    }

    $validator = Validator::make($request->all(), [
        'name' => ['required', 'string', 'max:100'],
    ], [
        'name.required' => 'Nama grup wajib diisi.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi grup soal gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $name = trim($validator->validated()['name']);

    $duplicate = DB::table('tbl_question_groups')
        ->where('package_id', $group->package_id)
        ->where('question_type', $group->question_type)
        ->whereNull('deleted_at')
        ->where('id', '!=', $id)
        ->whereRaw('LOWER(name) = ?', [strtolower($name)])
        ->exists();

    if ($duplicate) {
        return response()->json([
            'message' => 'Grup dengan nama tersebut sudah ada di paket ini.',
        ], 422);
    }

    DB::table('tbl_question_groups')
        ->where('id', $id)
        ->update(['name' => $name, 'updated_at' => now()]);

    return response()->json([
        'message' => 'Grup soal berhasil diperbarui.',
        'data' => [
            'id' => (int) $group->id,
            'package_id' => $group->package_id !== null ? (int) $group->package_id : null,
            'question_type' => $group->question_type,
            'name' => $name,
            'sort_order' => (int) $group->sort_order,
            'is_locked' => (bool) $group->is_locked,
        ],
    ]);
});

Route::delete('/admin/question-groups/{id}', function ($id) {
    $group = DB::table('tbl_question_groups')
        ->where('id', $id)
        ->whereNull('deleted_at')
        ->first();

    if (!$group) {
        return response()->json(['message' => 'Grup soal tidak ditemukan.'], 404);
    }

    if ($group->is_locked) {
        return response()->json(['message' => 'Grup SKD sudah baku dan tidak dapat dihapus.'], 422);
    }

    $stillUsed = DB::table('tbl_questions')
        ->where('question_group', $id)
        ->whereNull('deleted_at')
        ->exists();

    if ($stillUsed) {
        return response()->json(['message' => 'Grup masih dipakai oleh soal, tidak bisa dihapus.'], 422);
    }

    DB::table('tbl_question_groups')
        ->where('id', $id)
        ->update(['deleted_at' => now(), 'updated_at' => now()]);

    return response()->json([
        'message' => 'Grup soal berhasil dihapus.',
    ]);
});

Route::get('/admin/packages', function (Request $request) {
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
});

Route::get('/admin/ref-paket', function (Request $request) {
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
});

Route::post('/admin/packages', function (Request $request) {
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
});

Route::get('/admin/packages/{pid}', function ($pid) {
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
});

Route::put('/admin/packages/{pid}', function (Request $request, $pid) {
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
});

Route::get('/admin/materials', function (Request $request) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
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

    $materials = $query->get()->map(fn ($item) => mapMaterialRow($item));

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
});

Route::post('/admin/materials', function (Request $request) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
    }

    $validator = Validator::make($request->all(), [
        'package_id' => ['required', 'integer', 'exists:tbl_paket,pid'],
        'judul' => ['required', 'string', 'max:200'],
        'deskripsi' => ['nullable', 'string'],
        'sort_order' => ['nullable', 'integer', 'min:0'],
        'is_published' => ['nullable', 'boolean'],
        'file' => ['required', 'file', 'mimes:pdf', 'max:' . materialMaxUploadKb()],
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
        $storedPath = Storage::disk('private')->putFileAs('materials', $uploadedFile, $safeFileName);

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
        if ($storedPath && Storage::disk('private')->exists($storedPath)) {
            Storage::disk('private')->delete($storedPath);
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
        'data' => mapMaterialRow($material),
    ], 201);
});

Route::get('/admin/materials/{pid}', function ($pid) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
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
        'data' => mapMaterialRow($material),
    ]);
});

Route::put('/admin/materials/{pid}', function (Request $request, $pid) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
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
        'file' => ['nullable', 'file', 'mimes:pdf', 'max:' . materialMaxUploadKb()],
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
            $nextFilePath = Storage::disk('private')->putFileAs('materials', $uploadedFile, $safeFileName);
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
        if ($replaceFile && $nextFilePath && Storage::disk('private')->exists($nextFilePath)) {
            Storage::disk('private')->delete($nextFilePath);
        }

        throw $error;
    }

    if ($replaceFile && $oldFilePath && $oldFilePath !== $nextFilePath && Storage::disk('private')->exists($oldFilePath)) {
        Storage::disk('private')->delete($oldFilePath);
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
        'data' => mapMaterialRow($material),
    ]);
});

Route::delete('/admin/materials/{pid}', function (Request $request, $pid) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
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

    if (!empty($material->file_path) && Storage::disk('private')->exists($material->file_path)) {
        Storage::disk('private')->delete($material->file_path);
    }

    return response()->json([
        'message' => 'Materi berhasil dihapus.',
    ]);
});

Route::get('/materials', function (Request $request) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
    }

    $userId = (int) $request->query('user_id', 0);
    $search = trim((string) $request->query('search', ''));
    $packageId = (int) $request->query('package_id', 0);
    $accessiblePackageIds = userPurchasedPackageIds($userId);

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

    $materials = $query->get()->map(fn ($item) => mapMaterialRow($item));

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
});

Route::get('/materials/{pid}/view', function (Request $request, $pid) {
    if (!Schema::hasTable('tbl_materi')) {
        return materialTableMissingResponse();
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

    $userId = (int) $request->query('user_id', $request->input('user_id', 0));
    $isAdmin = (int) ($request->user()->is_admin ?? 0) === 1;

    if (!$isAdmin && !userHasMaterialAccess($userId, (int) $material->package_id)) {
        return response()->json([
            'message' => 'Anda belum memiliki akses ke materi ini.',
        ], 403);
    }

    if (!Storage::disk('private')->exists($material->file_path)) {
        return response()->json([
            'message' => 'File materi tidak ditemukan.',
        ], 404);
    }

    $stream = Storage::disk('private')->readStream($material->file_path);
    if ($stream === false) {
        return response()->json([
            'message' => 'File materi tidak dapat dibuka.',
        ], 500);
    }

    $filename = str_replace('"', '', $material->original_name ?: ($material->judul . '.pdf'));
    $headers = [
        'Content-Type' => $material->mime_type ?: 'application/pdf',
        'Content-Disposition' => 'inline; filename="' . $filename . '"',
        'Content-Length' => (string) Storage::disk('private')->size($material->file_path),
        'X-Content-Type-Options' => 'nosniff',
        'Cache-Control' => 'private, no-store, max-age=0, must-revalidate',
    ];

    notifyAdminUsers(
        'material.viewed',
        'Materi dibuka user',
        'User #' . $userId . ' membuka materi ' . $material->judul . '.',
        '/dashboard-admin/materials',
        ['icon' => '📄'],
        ['pid' => $userId, 'material_id' => (int) $material->pid, 'package_id' => (int) $material->package_id]
    );

    return response()->stream(function () use ($stream) {
        fpassthru($stream);

        if (is_resource($stream)) {
            fclose($stream);
        }
    }, 200, $headers);
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

Route::get('/admin/notifications', function (Request $request) {
    if (!Schema::hasTable('notifications')) {
        return adminNotificationTableMissingResponse();
    }

    $adminUserId = (int) $request->query('admin_user_id', $request->user()?->pid ?? 0);
    $limit = max(1, min((int) $request->query('limit', 10), 50));

    if ($adminUserId <= 0) {
        return response()->json([
            'message' => 'ID admin wajib diisi.',
            'summary' => [
                'total_notifications' => 0,
                'unread_notifications' => 0,
            ],
            'data' => [],
        ], 422);
    }

    $admin = User::query()
        ->where('pid', $adminUserId)
        ->where('is_admin', 1)
        ->first();

    if (!$admin) {
        return response()->json([
            'message' => 'Admin tidak ditemukan.',
            'summary' => [
                'total_notifications' => 0,
                'unread_notifications' => 0,
            ],
            'data' => [],
        ], 404);
    }

    $notifications = $admin->notifications()
        ->orderByDesc('created_at')
        ->limit($limit)
        ->get()
        ->map(fn ($notification) => mapAdminNotification($notification))
        ->values();

    return response()->json([
        'message' => 'Notifikasi admin berhasil dimuat.',
        'summary' => [
            'total_notifications' => (int) $admin->notifications()->count(),
            'unread_notifications' => (int) $admin->unreadNotifications()->count(),
        ],
        'data' => $notifications,
    ]);
});

Route::get('/admin/notifications/unread-count', function (Request $request) {
    if (!Schema::hasTable('notifications')) {
        return adminNotificationTableMissingResponse();
    }

    $adminUserId = (int) $request->query('admin_user_id', $request->user()?->pid ?? 0);

    if ($adminUserId <= 0) {
        return response()->json(['message' => 'ID admin wajib diisi.', 'count' => 0], 422);
    }

    $admin = User::query()
        ->where('pid', $adminUserId)
        ->where('is_admin', 1)
        ->first();

    if (!$admin) {
        return response()->json(['message' => 'Admin tidak ditemukan.', 'count' => 0], 404);
    }

    return response()->json([
        'message' => 'Jumlah notifikasi belum dibaca berhasil dimuat.',
        'count' => (int) $admin->unreadNotifications()->count(),
    ]);
});

Route::patch('/admin/notifications/{notificationId}/read', function (Request $request, string $notificationId) {
    if (!Schema::hasTable('notifications')) {
        return adminNotificationTableMissingResponse();
    }

    $adminUserId = (int) $request->input('admin_user_id', $request->query('admin_user_id', $request->user()?->pid ?? 0));

    if ($adminUserId <= 0) {
        return response()->json(['message' => 'ID admin wajib diisi.'], 422);
    }

    $admin = User::query()
        ->where('pid', $adminUserId)
        ->where('is_admin', 1)
        ->first();

    if (!$admin) {
        return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
    }

    $notification = $admin->notifications()->where('id', $notificationId)->first();

    if (!$notification) {
        return response()->json(['message' => 'Notifikasi tidak ditemukan.'], 404);
    }

    if ($notification->read_at === null) {
        $notification->markAsRead();
    }

    return response()->json([
        'message' => 'Notifikasi berhasil ditandai sebagai dibaca.',
        'data' => mapAdminNotification($notification->fresh()),
    ]);
});

Route::patch('/admin/notifications/read-all', function (Request $request) {
    if (!Schema::hasTable('notifications')) {
        return adminNotificationTableMissingResponse();
    }

    $adminUserId = (int) $request->input('admin_user_id', $request->query('admin_user_id', $request->user()?->pid ?? 0));

    if ($adminUserId <= 0) {
        return response()->json(['message' => 'ID admin wajib diisi.'], 422);
    }

    $admin = User::query()
        ->where('pid', $adminUserId)
        ->where('is_admin', 1)
        ->first();

    if (!$admin) {
        return response()->json(['message' => 'Admin tidak ditemukan.'], 404);
    }

    $updated = $admin->unreadNotifications()->update(['read_at' => now()]);

    return response()->json([
        'message' => 'Semua notifikasi berhasil ditandai sebagai dibaca.',
        'updated' => (int) $updated,
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
            'created_at' => $user->created_at,
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

    notifyAdminUsers(
        'user.registered',
        'User baru terdaftar',
        'Akun baru dibuat dengan email ' . $input['email'] . '.',
        '/dashboard-admin/users',
        ['icon' => '🆕'],
        ['pid' => $userId, 'email' => $input['email']]
    );

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

    notifyAdminUsers(
        'user.login',
        'User login',
        'User ' . ($user->email ?? 'unknown') . ' berhasil login.',
        '/dashboard-admin/users',
        ['icon' => '🔐'],
        ['pid' => (int) $user->pid, 'email' => (string) $user->email]
    );

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

    $profileUser = DB::table('tbl_user')
        ->where('pid', $input['pid_user'])
        ->first();

    notifyAdminUsers(
        'user.profile_completed',
        'Profil user diperbarui',
        'Profil ' . ($input['nama'] ?: ($profileUser->email ?? 'user')) . ' sudah dilengkapi.',
        '/dashboard-admin/users',
        ['icon' => '👤'],
        ['pid' => (int) $input['pid_user'], 'email' => $profileUser->email ?? null]
    );

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
