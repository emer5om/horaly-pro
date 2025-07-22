<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Customer extends Authenticatable
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'last_name',
        'birth_date',
        'notes',
        'is_blocked',
        'list_type',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'is_blocked' => 'boolean',
    ];

    protected $appends = [
        'full_name',
    ];

    public function establishments()
    {
        return $this->belongsToMany(Establishment::class, 'customer_establishments');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function favoriteServices(): HasMany
    {
        return $this->hasMany(CustomerFavoriteService::class);
    }

    public function getFullNameAttribute()
    {
        return $this->name . ($this->last_name ? ' ' . $this->last_name : '');
    }

    // Para autenticação sem senha, apenas com telefone
    public function getAuthIdentifierName()
    {
        return 'id'; // Usar id para identificação na sessão
    }

    public function getAuthPassword()
    {
        return null; // Sem senha
    }
}
