<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['package_id', 'judul', 'deskripsi', 'file_path', 'original_name', 'mime_type', 'file_size', 'sort_order', 'is_published', 'created_by', 'updated_by'])]
class Material extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_materi';

    protected function casts(): array
    {
        return [
            'package_id' => 'integer',
            'file_size' => 'integer',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }
}
