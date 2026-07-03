<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['ljk_id', 'question_id', 'question_group', 'option_id', 'answer_id', 'value'])]
class AnswerSheet extends Model
{
    use HasFactory;

    protected $table = 'tbl_answer_sheet';
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'ljk_id' => 'integer',
            'question_id' => 'integer',
            'question_group' => 'integer',
            'option_id' => 'integer',
            'answer_id' => 'integer',
            'value' => 'integer',
        ];
    }

    public function ljk()
    {
        return $this->belongsTo(Ljk::class, 'ljk_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }

    public function option()
    {
        return $this->belongsTo(QuestionOption::class, 'option_id');
    }

    public function answer()
    {
        return $this->belongsTo(QuestionOption::class, 'answer_id');
    }
}
