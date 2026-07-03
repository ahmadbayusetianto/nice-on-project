<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['question_id', 'choise', 'answer', 'istext'])]
class QuestionOption extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_question_options';

    protected function casts(): array
    {
        return [
            'question_id' => 'integer',
            'answer' => 'boolean',
            'istext' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }
}
