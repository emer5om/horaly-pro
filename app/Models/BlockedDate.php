<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedDate extends Model
{
    protected $fillable = [
        'establishment_id',
        'blocked_date',
        'reason',
        'is_recurring',
    ];

    protected $casts = [
        'blocked_date' => 'date',
        'is_recurring' => 'boolean',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }
}