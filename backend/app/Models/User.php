<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $table = 'tbl_user';

    protected $primaryKey = 'pid';

    public $incrementing = true;

    protected $keyType = 'int';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function ljk()
    {
        return $this->hasMany(Ljk::class, 'user_id');
    }

    public function sendPasswordResetNotification($token)
    {
        $url = rtrim(config('app.frontend_url'), '/')
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($this->email);

        $this->notify(new \App\Notifications\ResetPasswordNotification($url));
    }
}
