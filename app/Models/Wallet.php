<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = [
        'establishment_id',
        'balance',
        'pending_balance',
        'total_received',
        'total_withdrawn',
        'pix_key',
        'pix_key_type',
        'active',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'pending_balance' => 'decimal:2',
        'total_received' => 'decimal:2',
        'total_withdrawn' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'establishment_id', 'establishment_id');
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(Withdrawal::class, 'establishment_id', 'establishment_id');
    }

    public function getAvailableBalanceAttribute(): float
    {
        return $this->balance;
    }

    public function canWithdraw(float $amount): bool
    {
        return $this->active && $this->balance >= $amount && $amount > 0;
    }

    public function addBalance(float $amount): void
    {
        $this->increment('balance', $amount);
        $this->increment('total_received', $amount);
    }

    public function deductBalance(float $amount): void
    {
        $this->decrement('balance', $amount);
        $this->increment('total_withdrawn', $amount);
    }

    public function addPendingBalance(float $amount): void
    {
        $this->increment('pending_balance', $amount);
    }

    public function confirmPendingBalance(float $amount): void
    {
        $this->decrement('pending_balance', $amount);
        $this->addBalance($amount);
    }

    public function cancelPendingBalance(float $amount): void
    {
        $this->decrement('pending_balance', $amount);
    }
}
