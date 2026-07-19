<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['question', 'question_type', 'question_group', 'istext', 'information', 'pembahasan'])]
class Question extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_questions';

    protected function casts(): array
    {
        return [
            'question_group' => 'integer',
            'istext' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function options()
    {
        return $this->hasMany(QuestionOption::class, 'question_id');
    }

    public function answerSheets()
    {
        return $this->hasMany(AnswerSheet::class, 'question_id');
    }

    public function group()
    {
        return $this->belongsTo(QuestionGroup::class, 'question_group');
    }
}
