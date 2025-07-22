<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'establishment_id',
        'appointment_id',
        'title',
        'message',
        'type',
        'read',
        'customer_name',
    ];

    protected $casts = [
        'read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(User::class, 'establishment_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public static function createForAppointment(Appointment $appointment, string $type, string $title, string $message): self
    {
        return self::create([
            'establishment_id' => $appointment->establishment_id,
            'appointment_id' => $appointment->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'customer_name' => $appointment->customer->name . ' ' . ($appointment->customer->surname ?? ''),
        ]);
    }
}
