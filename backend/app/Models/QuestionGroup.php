<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['package_id', 'question_type', 'name', 'sort_order', 'is_locked'])]
class QuestionGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_question_groups';

    protected function casts(): array
    {
        return [
            'package_id' => 'integer',
            'sort_order' => 'integer',
            'is_locked' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'question_group');
    }
}
