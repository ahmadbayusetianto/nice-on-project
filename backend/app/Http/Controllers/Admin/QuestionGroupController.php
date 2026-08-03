<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class QuestionGroupController extends Controller
{
    public function index(Request $request)
    {
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
    }

    public function store(Request $request)
    {
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
    }

    public function update(Request $request, $id)
    {
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
    }

    public function destroy($id)
    {
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
    }
}
