<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'establishment_id',
        'name',
        'description',
        'price',
        'duration_minutes',
        'has_promotion',
        'promotion_price',
        'allow_rescheduling',
        'allow_cancellation',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'promotion_price' => 'decimal:2',
        'has_promotion' => 'boolean',
        'allow_rescheduling' => 'boolean',
        'allow_cancellation' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function getFinalPriceAttribute()
    {
        return $this->has_promotion ? $this->promotion_price : $this->price;
    }
}
