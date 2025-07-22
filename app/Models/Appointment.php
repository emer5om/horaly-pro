<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    protected $fillable = [
        'establishment_id',
        'service_id',
        'customer_id',
        'scheduled_at',
        'started_at',
        'completed_at',
        'duration_minutes',
        'price',
        'discount_amount',
        'discount_code',
        'booking_fee_amount',
        'booking_fee_status',
        'booking_fee_transaction_id',
        'status',
        'payment_status',
        'payment_method',
        'payment_id',
        'notes',
        'cancellation_reason',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(AppointmentReminder::class);
    }

    public function getFinalPriceAttribute()
    {
        return $this->price - $this->discount_amount;
    }
}
