<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'package_id', 'skor_twk', 'skor_tiu', 'skor_tkp', 'skor_total', 'status', 'keterangan', 'finish_at'])]
class Ljk extends Model
{
    use HasFactory;

    protected $table = 'tbl_ljk';

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'package_id' => 'integer',
            'skor_twk' => 'integer',
            'skor_tiu' => 'integer',
            'skor_tkp' => 'integer',
            'skor_total' => 'integer',
            'status' => 'integer',
            'finish_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function answerSheets()
    {
        return $this->hasMany(AnswerSheet::class, 'ljk_id');
    }
}
