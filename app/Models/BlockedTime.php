<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedTime extends Model
{
    protected $fillable = [
        'establishment_id',
        'blocked_date',
        'start_time',
        'end_time',
        'reason',
    ];

    protected $casts = [
        'blocked_date' => 'date',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }
}