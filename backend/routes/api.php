<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\MaterialController;
use App\Http\Controllers\Admin\PackageController;
use App\Http\Controllers\Admin\ParameterController;
use App\Http\Controllers\Admin\QuestionGroupController;
use App\Http\Controllers\Admin\TestimonialController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\UserStatsController;
use App\Models\User;
use App\Services\AdminNotificationService;
use App\Services\MidtransService;
use App\Services\SystemParameterService;

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

    $durationMinutes = (new SystemParameterService())->intValue('exam.default_duration', 100);
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
            'auto_submit' => (new SystemParameterService())->boolValue('exam.auto_submit', true),
            'shuffle_question' => (new SystemParameterService())->boolValue('exam.shuffle_question', true),
            'shuffle_option' => (new SystemParameterService())->boolValue('exam.shuffle_option', true),
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

    $scoreCorrect = (new SystemParameterService())->intValue('exam.score_correct', 5);
    $scoreWrong = (new SystemParameterService())->intValue('exam.score_wrong', 0);
    $scoreBlank = (new SystemParameterService())->intValue('exam.score_blank', 0);

    if (!$selectedOptionId) {
        return $scoreBlank;
    }

    return (int) $selectedOptionId === (int) $answerOptionId ? $scoreCorrect : $scoreWrong;
}

Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $databaseStatus = 'ok';
    } catch (\Throwable $e) {
        $databaseStatus = 'error';
    }

    try {
        $transport = Mail::mailer()->getSymfonyTransport();
        if (method_exists($transport, 'start')) {
            $transport->start();
        }
        $mailStatus = 'ok';
    } catch (\Throwable $e) {
        $mailStatus = 'error';
    }

    $totalSpace = @disk_total_space(base_path());
    $freeSpace = @disk_free_space(base_path());
    $storageUsedPercent = ($totalSpace && $freeSpace !== false)
        ? round((($totalSpace - $freeSpace) / $totalSpace) * 100, 1)
        : null;

    return response()->json([
        'status' => 'ok',
        'service' => 'backend-api',
        'database' => $databaseStatus,
        'mail' => $mailStatus,
        'storage' => $storageUsedPercent,
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
})->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/parameters', [ParameterController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/parameters/{pid}', [ParameterController::class, 'show'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/parameters', [ParameterController::class, 'store'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/parameters/{pid}', [ParameterController::class, 'update'])->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/faqs', [FaqController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/faqs/{pid}', [FaqController::class, 'show'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/faqs', [FaqController::class, 'store'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/faqs/{pid}', [FaqController::class, 'update'])->middleware(['auth:sanctum', 'admin']);
Route::delete('/admin/faqs/{pid}', [FaqController::class, 'destroy'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/faqs/{pid}/restore', [FaqController::class, 'restore'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/faqs/{pid}/toggle', [FaqController::class, 'toggle'])->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/testimonials', [TestimonialController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/testimonials/{pid}', [TestimonialController::class, 'show'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/testimonials', [TestimonialController::class, 'store'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/testimonials/{pid}', [TestimonialController::class, 'update'])->middleware(['auth:sanctum', 'admin']);
Route::delete('/admin/testimonials/{pid}', [TestimonialController::class, 'destroy'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/testimonials/{pid}/restore', [TestimonialController::class, 'restore'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/testimonials/{pid}/toggle', [TestimonialController::class, 'toggle'])->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/users', [UserController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/users', [UserController::class, 'store'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/users/{pid}/toggle-role', [UserController::class, 'toggleRole'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/users/{pid}', [UserController::class, 'show'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/users/{pid}', [UserController::class, 'update'])->middleware(['auth:sanctum', 'admin']);

Route::get('/packages', [PackageController::class, 'publicIndex']);

Route::post('/checkout', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'pid_user' => ['required', 'integer', Rule::exists('tbl_user', 'pid')],
        'pid_paket' => ['required', 'integer', Rule::exists('tbl_paket', 'pid')->whereNull('deleted_at')],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi checkout gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();
    $pidUser = (int) $validated['pid_user'];
    $pidPaket = (int) $validated['pid_paket'];

    $paket = DB::table('tbl_paket')->where('pid', $pidPaket)->whereNull('deleted_at')->first();
    if (!$paket) {
        return response()->json(['message' => 'Paket tidak ditemukan.'], 404);
    }

    $user = DB::table('tbl_user')->where('pid', $pidUser)->first();
    $detail = DB::table('tbl_detail_user')->where('pid_user', $pidUser)->first();

    if ((int) ($user->is_admin ?? 0) === 1) {
        return response()->json(['message' => 'Akun admin tidak dapat membeli paket.'], 403);
    }

    // Server-computed amount — never trust a client-supplied amount.
    $grossAmount = (float) $paket->harga;
    $now = now();
    $orderId = 'NICEON-' . $pidPaket . '-' . $pidUser . '-' . $now->format('YmdHis') . '-' . Str::random(6);

    $transaksiId = DB::table('tbl_transaksi')->insertGetId([
        'pid_user' => $pidUser,
        'pid_paket' => $pidPaket,
        'status_transaksi' => 'pending',
        'midtrans_order_id' => $orderId,
        'gross_amount' => $grossAmount,
        'created_at' => $now,
        'created_by' => $pidUser,
        'updated_at' => null,
        'updated_by' => null,
    ]);

    $midtrans = new MidtransService();

    try {
        $snap = $midtrans->createSnapTransaction([
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) round($grossAmount),
            ],
            'item_details' => [[
                'id' => (string) $paket->pid,
                'price' => (int) round($grossAmount),
                'quantity' => 1,
                'name' => Str::limit((string) $paket->nama_paket, 50, ''),
            ]],
            'customer_details' => [
                'first_name' => $detail->nama ?? 'User',
                'email' => $user->email ?? null,
                'phone' => $detail->nohp ?? null,
            ],
        ]);
    } catch (\Throwable $e) {
        DB::table('tbl_transaksi')->where('pid', $transaksiId)->update([
            'status_transaksi' => 'cancelled',
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Gagal membuat transaksi pembayaran.'], 502);
    }

    DB::table('tbl_transaksi')->where('pid', $transaksiId)->update([
        'snap_token' => $snap['token'] ?? null,
        'snap_redirect_url' => $snap['redirect_url'] ?? null,
        'updated_at' => now(),
    ]);

    (new AdminNotificationService())->logUserActivity($pidUser, 'checkout', 'Checkout dimulai', "Memulai pembayaran paket {$paket->nama_paket}");

    return response()->json([
        'message' => 'Transaksi berhasil dibuat.',
        'data' => [
            'pid_transaksi' => $transaksiId,
            'order_id' => $orderId,
            'snap_token' => $snap['token'] ?? null,
            'gross_amount' => $grossAmount,
        ],
    ], 201);
})->middleware('auth:sanctum');

Route::post('/midtrans/notification', function (Request $request) {
    $notification = $request->all();
    $midtrans = new MidtransService();

    if (!$midtrans->verifySignature($notification)) {
        return response()->json(['message' => 'Invalid signature.'], 403);
    }

    $orderId = $notification['order_id'] ?? null;
    if (!$orderId) {
        return response()->json(['message' => 'order_id missing.'], 422);
    }

    $transaksi = DB::table('tbl_transaksi')->where('midtrans_order_id', $orderId)->first();
    if (!$transaksi) {
        // Midtrans expects a 2xx/4xx (not 5xx) response even for orders this
        // app never created, otherwise it keeps retrying indefinitely.
        return response()->json(['message' => 'Transaction not found.'], 404);
    }

    $newStatus = $midtrans->mapNotificationToStatus($notification);
    $rawStatus = (string) ($notification['transaction_status'] ?? '');
    $paymentType = $notification['payment_type'] ?? null;
    $wasPaid = $transaksi->status_transaksi === 'paid';

    $updates = [
        'status_transaksi' => $newStatus,
        'midtrans_transaction_status' => $rawStatus,
        'payment_type' => $paymentType,
        'raw_notification' => json_encode($notification),
        'updated_at' => now(),
    ];

    // Idempotency: Midtrans can resend the same notification, so only stamp
    // paid_date the first time this row transitions into 'paid'.
    if ($newStatus === 'paid' && !$wasPaid) {
        $updates['paid_date'] = now();
    }

    DB::table('tbl_transaksi')->where('pid', $transaksi->pid)->update($updates);

    // Side effects gated on a NEW paid transition, not merely "status is
    // paid", so a duplicate notification doesn't fire duplicate side effects.
    if ($newStatus === 'paid' && !$wasPaid) {
        $paket = DB::table('tbl_paket')->where('pid', $transaksi->pid_paket)->first();
        (new AdminNotificationService())->logUserActivity((int) $transaksi->pid_user, 'payment', 'Pembayaran berhasil', $paket->nama_paket ?? null);
        (new AdminNotificationService())->notify('payment', 'Pembayaran diterima', "Transaksi #{$transaksi->pid} berhasil dibayar.", '/admin/transactions');
    }

    return response()->json(['message' => 'OK']);
});

Route::get('/faqs', [FaqController::class, 'publicIndex']);

Route::get('/testimonials', [TestimonialController::class, 'publicIndex']);

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
})->middleware('auth:sanctum');

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

    $shuffleQuestion = (new SystemParameterService())->boolValue('exam.shuffle_question', true);
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
            1 => (new SystemParameterService())->intValue('catcpns.twk_default', 30),
            2 => (new SystemParameterService())->intValue('catcpns.tiu_default', 35),
            3 => (new SystemParameterService())->intValue('catcpns.tkp_default', 45),
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
    (new AdminNotificationService())->notify(
        'tryout.started',
        'Tryout dimulai',
        'User ' . ($user->email ?? ('#' . $validated['user_id'])) . ' memulai tryout ' . $package->nama_paket . '.',
        '/dashboard-admin/transactions',
        ['icon' => '📝'],
        ['pid' => (int) $validated['user_id'], 'package_id' => (int) $validated['package_id'], 'jenis_tryout' => $tryoutType]
    );

    (new AdminNotificationService())->logUserActivity(
        (int) $validated['user_id'],
        'tryout.started',
        'Tryout dimulai',
        'Anda memulai tryout ' . $package->nama_paket . '.',
        '📝',
        ['package_id' => (int) $validated['package_id'], 'jenis_tryout' => $tryoutType]
    );

    $payload = buildTryoutSessionPayload($ljkId, false, $request);

    return response()->json([
        'message' => 'Tryout berhasil dimulai.',
        'data' => $payload,
    ], 201);
})->middleware('auth:sanctum');

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

    $shuffleQuestion = (new SystemParameterService())->boolValue('exam.shuffle_question', true);
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
            1 => (new SystemParameterService())->intValue('catcpns.twk_default', 30),
            2 => (new SystemParameterService())->intValue('catcpns.tiu_default', 35),
            3 => (new SystemParameterService())->intValue('catcpns.tkp_default', 45),
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
})->middleware(['auth:sanctum', 'admin']);

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
})->middleware('auth:sanctum');

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
})->middleware('auth:sanctum');

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
        (new AdminNotificationService())->notify(
            'tryout.finished',
            'Tryout selesai',
            'User ' . ($user->email ?? ('#' . $userId)) . ' menyelesaikan tryout dengan skor ' . ($scoreTwk + $scoreTiu + $scoreTkp + $scoreOther) . '.',
            '/dashboard-admin/transactions',
            ['icon' => '🏁'],
            ['pid' => $userId, 'session_id' => (int) $ljkId, 'score_total' => $scoreTwk + $scoreTiu + $scoreTkp + $scoreOther]
        );

        (new AdminNotificationService())->logUserActivity(
            (int) $userId,
            'tryout.finished',
            'Tryout selesai',
            'Anda menyelesaikan tryout dengan skor ' . ($scoreTwk + $scoreTiu + $scoreTkp + $scoreOther) . '.',
            '🏁',
            ['session_id' => (int) $ljkId, 'score_total' => $scoreTwk + $scoreTiu + $scoreTkp + $scoreOther]
        );
    }

    return response()->json([
        'message' => 'Tryout selesai dan skor berhasil dihitung.',
        'data' => $payload,
    ]);
})->middleware('auth:sanctum');

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
})->middleware(['auth:sanctum', 'admin']);

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
})->middleware(['auth:sanctum', 'admin']);

Route::post('/admin/questions', function (Request $request) {
    $isText = $request->boolean('istext');
    $optionsIsText = $request->boolean('options_istext');
    $questionTypeInput = normalizeQuestionType((string) $request->input('question_type', 'SKD'));

    $rules = [
        'question_type' => ['required', 'string', 'in:SKD,SKB,single,skd,skb'],
        'question_group' => $questionTypeInput === 'SKB'
            ? ['nullable', 'integer']
            : ['required', 'integer', questionGroupValidationRule($questionTypeInput, $request->input('package_id'))],
        'package_id' => ['required', 'integer', Rule::exists('ref_paket', 'pid')->whereNull('deleted_at')],
        'istext' => ['required', 'boolean'],
        'options_istext' => ['required', 'boolean'],
        'information' => ['nullable', 'string'],
        'pembahasan' => ['nullable', 'string'],
        'options' => ['required', 'array', 'min:1'],
        'options.*.answer' => ['nullable', 'boolean'],
        'options.*.istext' => ['nullable', 'boolean'],
        'options.*.nilai_tkp' => ['nullable', 'integer', 'min:1', 'max:5', 'required_if:question_group,3'],
    ];

    $rules['question_image'] = [
        $isText ? 'nullable' : 'required',
        'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb(),
    ];

    if ($optionsIsText) {
        $rules['options.*.choise'] = ['required', 'string'];
    } else {
        $rules['options.*.choise'] = ['nullable', 'string'];
        $rules['options.*.image'] = ['required', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()];
    }

    if ($isText) {
        $rules['question'] = ['required', 'string'];
    } else {
        $rules['question'] = ['nullable', 'string'];
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

    $questionImagePath = $request->hasFile('question_image')
        ? storeUploadedQuestionImage($request->file('question_image'), 'questions')
        : null;

    $normalizedOptions = collect($validated['options'])
        ->values()
        ->map(function ($option, $index) use ($isTkpGroup, $optionsIsText, $request) {
            return [
                'choise' => $optionsIsText ? trim((string) ($option['choise'] ?? '')) : '',
                'answer' => (int) filter_var($option['answer'] ?? false, FILTER_VALIDATE_BOOL) === 1,
                'istext' => $optionsIsText,
                'nilai_tkp' => $isTkpGroup && ($option['nilai_tkp'] ?? null) !== null && $option['nilai_tkp'] !== ''
                    ? (int) $option['nilai_tkp']
                    : null,
                'image_path' => $optionsIsText ? null : storeUploadedQuestionImage($request->file("options.$index.image"), 'question-options'),
            ];
        });

    if ($optionsIsText) {
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
})->middleware(['auth:sanctum', 'admin']);

Route::put('/admin/questions/{id}', function (Request $request, $id) {
    $isText = $request->boolean('istext');
    $optionsIsText = $request->boolean('options_istext');
    $questionTypeInput = normalizeQuestionType((string) $request->input('question_type', 'SKD'));

    $rules = [
        'question_type' => ['required', 'string', 'in:SKD,SKB,single,skd,skb'],
        'question_group' => $questionTypeInput === 'SKB'
            ? ['nullable', 'integer']
            : ['required', 'integer', questionGroupValidationRule($questionTypeInput, $request->input('package_id'))],
        'package_id' => ['required', 'integer', Rule::exists('ref_paket', 'pid')->whereNull('deleted_at')],
        'istext' => ['required', 'boolean'],
        'options_istext' => ['required', 'boolean'],
        'information' => ['nullable', 'string'],
        'pembahasan' => ['nullable', 'string'],
        'options' => ['required', 'array', 'min:1'],
        'options.*.answer' => ['nullable', 'boolean'],
        'options.*.istext' => ['nullable', 'boolean'],
        'options.*.nilai_tkp' => ['nullable', 'integer', 'min:1', 'max:5', 'required_if:question_group,3'],
        'options.*.existing_image_path' => ['nullable', 'string'],
    ];

    $rules['question_image'] = ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:' . questionImageMaxUploadKb()];
    $rules['existing_question_image_path'] = ['nullable', 'string'];

    if ($isText) {
        $rules['question'] = ['required', 'string'];
    } else {
        $rules['question'] = ['nullable', 'string'];
    }

    if ($optionsIsText) {
        $rules['options.*.choise'] = ['required', 'string'];
    } else {
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

    $uploadedQuestionImage = $request->file('question_image');
    $questionImagePath = $uploadedQuestionImage
        ? storeUploadedQuestionImage($uploadedQuestionImage, 'questions')
        : ($validated['existing_question_image_path'] ?? null);

    if (!$isText && empty($questionImagePath)) {
        return response()->json([
            'message' => 'Gambar soal wajib diunggah.',
        ], 422);
    }

    $normalizedOptions = collect($validated['options'])
        ->values()
        ->map(function ($option, $index) use ($isTkpGroup, $optionsIsText, $request) {
            $imagePath = null;
            if (!$optionsIsText) {
                $uploaded = $request->file("options.$index.image");
                $imagePath = $uploaded
                    ? storeUploadedQuestionImage($uploaded, 'question-options')
                    : ($option['existing_image_path'] ?? null);
            }

            return [
                'choise' => $optionsIsText ? trim((string) ($option['choise'] ?? '')) : '',
                'answer' => (int) filter_var($option['answer'] ?? false, FILTER_VALIDATE_BOOL) === 1,
                'istext' => $optionsIsText,
                'nilai_tkp' => $isTkpGroup && ($option['nilai_tkp'] ?? null) !== null && $option['nilai_tkp'] !== ''
                    ? (int) $option['nilai_tkp']
                    : null,
                'image_path' => $imagePath,
            ];
        });

    if ($optionsIsText) {
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
})->middleware(['auth:sanctum', 'admin']);

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
})->middleware(['auth:sanctum', 'admin']);

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
})->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/question-groups', [QuestionGroupController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/question-groups', [QuestionGroupController::class, 'store'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/question-groups/{id}', [QuestionGroupController::class, 'update'])->middleware(['auth:sanctum', 'admin']);
Route::delete('/admin/question-groups/{id}', [QuestionGroupController::class, 'destroy'])->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/packages', [PackageController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/ref-paket', [PackageController::class, 'refPaket'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/packages', [PackageController::class, 'store'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/packages/{pid}', [PackageController::class, 'show'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/packages/{pid}', [PackageController::class, 'update'])->middleware(['auth:sanctum', 'admin']);
Route::delete('/admin/packages/{pid}', [PackageController::class, 'destroy'])->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/materials', [MaterialController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::post('/admin/materials', [MaterialController::class, 'store'])->middleware(['auth:sanctum', 'admin']);

Route::get('/admin/materials/{pid}', [MaterialController::class, 'show'])->middleware(['auth:sanctum', 'admin']);
Route::put('/admin/materials/{pid}', [MaterialController::class, 'update'])->middleware(['auth:sanctum', 'admin']);

Route::delete('/admin/materials/{pid}', [MaterialController::class, 'destroy'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/materials/{pid}/download', [MaterialController::class, 'download'])->middleware(['auth:sanctum', 'admin']);

Route::get('/materials', [MaterialController::class, 'publicIndex'])->middleware('auth:sanctum');
Route::get('/materials/{pid}/view', [MaterialController::class, 'view'])->middleware('auth:sanctum');

Route::get('/admin/transactions', [TransactionController::class, 'index'])->middleware(['auth:sanctum', 'admin']);

Route::get('/me', [MeController::class, 'show']);

Route::get('/admin/notifications', [AdminNotificationController::class, 'index'])->middleware(['auth:sanctum', 'admin']);
Route::get('/admin/notifications/unread-count', [AdminNotificationController::class, 'unreadCount'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/notifications/{notificationId}/read', [AdminNotificationController::class, 'markRead'])->middleware(['auth:sanctum', 'admin']);
Route::patch('/admin/notifications/read-all', [AdminNotificationController::class, 'markAllRead'])->middleware(['auth:sanctum', 'admin']);

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
})->middleware('auth:sanctum');

Route::put('/account-profile/{pid}/password', function (Request $request, $pid) {
    $user = DB::table('tbl_user')->where('pid', $pid)->first();

    if (!$user) {
        return response()->json([
            'message' => 'Data profil tidak ditemukan.',
        ], 404);
    }

    $input = [
        'current_password' => $request->input('current_password'),
        'password' => $request->input('password'),
        'password_confirmation' => $request->input('password_confirmation'),
    ];

    $validator = Validator::make($input, [
        'current_password' => ['required', 'string'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],
    ], [
        'password.confirmed' => 'Konfirmasi password tidak cocok.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    if (!Hash::check($input['current_password'], $user->password)) {
        return response()->json([
            'message' => 'Password saat ini tidak sesuai.',
            'errors' => [
                'current_password' => ['Password saat ini tidak sesuai.'],
            ],
        ], 422);
    }

    DB::table('tbl_user')
        ->where('pid', $pid)
        ->update([
            'password' => Hash::make($input['password']),
            'updated_at' => now(),
        ]);

    (new AdminNotificationService())->logUserActivity((int) $pid, 'password.updated', 'Password diperbarui', 'Anda mengganti password akun.', '🔒');

    return response()->json([
        'message' => 'Password berhasil diperbarui.',
    ]);
})->middleware(['auth:sanctum', 'throttle:5,1']);

Route::put('/account-profile/{pid}', function (Request $request, $pid) {
    $user = DB::table('tbl_user')->where('pid', $pid)->first();

    if (!$user) {
        return response()->json([
            'message' => 'Data profil tidak ditemukan.',
        ], 404);
    }

    $input = [
        'nama' => $request->input('nama'),
        'ttl' => $request->input('ttl'),
        'gender' => $request->input('gender'),
        'nohp' => $request->input('nohp'),
        'alamat' => $request->input('alamat'),
        'refference' => $request->input('refference'),
        'reference_other' => $request->input('reference_other'),
    ];

    $validator = Validator::make($input, [
        'nama' => ['required', 'string', 'max:150'],
        'ttl' => ['nullable', 'string', 'max:150'],
        'gender' => ['nullable', 'in:L,P'],
        'nohp' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9]+$/'],
        'alamat' => ['nullable', 'string'],
        'refference' => ['nullable', 'string', 'max:150'],
        'reference_other' => ['nullable', 'string', 'max:150', 'required_if:refference,Lainnya'],
    ], [
        'nama.required' => 'Nama wajib diisi.',
        'gender.in' => 'Jenis kelamin harus L atau P.',
        'nohp.regex' => 'No. HP hanya boleh berisi angka.',
        'reference_other.required_if' => 'Isi referensi lainnya jika memilih Lainnya.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi profil gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $validated = $validator->validated();

    DB::transaction(function () use ($pid, $validated) {
        $now = now();

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

    (new AdminNotificationService())->logUserActivity((int) $pid, 'profile.updated', 'Profil diperbarui', 'Anda memperbarui data profil.', '✏️');

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
        'message' => 'Profil berhasil diperbarui.',
        'data' => [
            'pid' => (int) $updatedUser->pid,
            'email' => $updatedUser->email,
            'status' => $updatedUser->status,
            'is_admin' => (int) $updatedUser->is_admin,
            'created_at' => $updatedUser->created_at,
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
})->middleware('auth:sanctum');

Route::get('/users/{pid}/activity-log', [UserStatsController::class, 'activityLog'])->middleware('auth:sanctum');
Route::get('/users/{pid}/learning-streak', [UserStatsController::class, 'learningStreak'])->middleware('auth:sanctum');
Route::get('/users/{pid}/tryout-history', [UserStatsController::class, 'tryoutHistory'])->middleware('auth:sanctum');
Route::get('/users/{pid}/activity-calendar', [UserStatsController::class, 'activityCalendar'])->middleware('auth:sanctum');
Route::get('/users/{pid}/transactions', [UserStatsController::class, 'transactions'])->middleware('auth:sanctum');

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

    (new AdminNotificationService())->notify(
        'user.registered',
        'User baru terdaftar',
        'Akun baru dibuat dengan email ' . $input['email'] . '.',
        '/dashboard-admin/users',
        ['icon' => '🆕'],
        ['pid' => $userId, 'email' => $input['email']]
    );

    (new AdminNotificationService())->logUserActivity(
        (int) $userId,
        'user.registered',
        'Akun berhasil dibuat',
        'Selamat datang! Akun Anda telah berhasil didaftarkan.',
        '🆕'
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

    $user = User::where('email', $input['email'])->first();

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

    Auth::login($user);
    $request->session()->regenerate();

    $detailUser = DB::table('tbl_detail_user')
        ->where('pid_user', $user->pid)
        ->first();

    (new AdminNotificationService())->notify(
        'user.login',
        'User login',
        'User ' . ($user->email ?? 'unknown') . ' berhasil login.',
        '/dashboard-admin/users',
        ['icon' => '🔐'],
        ['pid' => (int) $user->pid, 'email' => (string) $user->email]
    );

    (new AdminNotificationService())->logUserActivity(
        (int) $user->pid,
        'user.login',
        'Login berhasil',
        'Anda berhasil masuk ke akun.',
        '🔐'
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

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logout berhasil.']);
});

Route::post('/forgot-password', function (Request $request) {
    $validator = Validator::make($request->only('email'), [
        'email' => ['required', 'email'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    Password::sendResetLink($request->only('email'));

    // Pesan selalu generik — tidak membedakan email terdaftar/tidak, untuk mencegah user enumeration.
    return response()->json([
        'message' => 'Jika email terdaftar, tautan reset password akan dikirim ke email tersebut.',
    ]);
})->middleware('throttle:5,1');

Route::post('/reset-password', function (Request $request) {
    $input = [
        'token' => $request->input('token'),
        'email' => $request->input('email'),
        'password' => $request->input('password'),
        'password_confirmation' => $request->input('password_confirmation', $request->input('confirmPassword')),
    ];

    $validator = Validator::make($input, [
        'token' => ['required', 'string'],
        'email' => ['required', 'email'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],
    ], [
        'password.confirmed' => 'Konfirmasi password tidak cocok.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi gagal.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $status = Password::reset($input, function ($user, $password) {
        $user->forceFill(['password' => $password])->save();
    });

    if ($status === Password::PASSWORD_RESET) {
        return response()->json([
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ]);
    }

    // Semua kegagalan (token salah, kedaluwarsa, email tak cocok) pakai pesan generik yang sama
    // — membedakan pesan akan jadi oracle untuk menebak apakah reset pernah diminta untuk email itu.
    return response()->json([
        'message' => 'Tautan reset password tidak valid atau sudah kedaluwarsa.',
    ], 400);
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

    (new AdminNotificationService())->notify(
        'user.profile_completed',
        'Profil user diperbarui',
        'Profil ' . ($input['nama'] ?: ($profileUser->email ?? 'user')) . ' sudah dilengkapi.',
        '/dashboard-admin/users',
        ['icon' => '👤'],
        ['pid' => (int) $input['pid_user'], 'email' => $profileUser->email ?? null]
    );

    (new AdminNotificationService())->logUserActivity(
        (int) $input['pid_user'],
        'user.profile_completed',
        'Profil dilengkapi',
        'Anda melengkapi informasi profil.',
        '👤'
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
