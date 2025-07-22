<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'establishment_id',
        'service_id',
        'promotional_price',
        'name',
        'message',
        'status',
        'target_type',
        'selected_clients',
        'period_start',
        'period_end',
        'delay_minutes',
        'sent_count',
        'delivered_count',
        'failed_count',
        'total_targets',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'selected_clients' => 'array',
        'period_start' => 'date',
        'period_end' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function campaignMessages(): HasMany
    {
        return $this->hasMany(CampaignMessage::class);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['running']);
    }

    public function canBeStarted(): bool
    {
        return in_array($this->status, ['draft', 'paused']);
    }

    public function canBePaused(): bool
    {
        return $this->status === 'running';
    }

    public function canBeDeleted(): bool
    {
        return in_array($this->status, ['draft', 'completed', 'paused']);
    }

    public function getProgressPercentage(): int
    {
        if ($this->total_targets === 0) {
            return 0;
        }
        
        return round(($this->sent_count / $this->total_targets) * 100);
    }

    public function getSuccessRate(): int
    {
        if ($this->sent_count === 0) {
            return 0;
        }
        
        return round(($this->delivered_count / $this->sent_count) * 100);
    }
}