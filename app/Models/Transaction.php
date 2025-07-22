<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'external_id',
        'establishment_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'amount',
        'commission_amount',
        'net_amount',
        'commission_percentage',
        'status',
        'type',
        'description',
        'payment_method',
        'mercadopago_payment_id',
        'mercadopago_data',
        'mercadopago_status',
        'pix_qr_code_base64',
        'pix_qr_code',
        'expires_at',
        'last_status_check',
        'approved_at',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'payment_method' => 'array',
        'mercadopago_data' => 'array',
        'expires_at' => 'datetime',
        'last_status_check' => 'datetime',
        'approved_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isWaitingPayment(): bool
    {
        return $this->status === 'waiting_payment';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->expires_at && $this->expires_at->isPast());
    }

    public function isProcessed(): bool
    {
        return !is_null($this->processed_at);
    }

    public function markAsPaid(): void
    {
        $this->update([
            'status' => 'paid',
            'approved_at' => now(),
        ]);
    }

    public function markAsWaitingPayment(): void
    {
        $this->update([
            'status' => 'waiting_payment',
        ]);
    }

    public function markAsExpired(): void
    {
        $this->update([
            'status' => 'expired',
        ]);
    }

    public function markAsProcessed(): void
    {
        $this->update([
            'processed_at' => now(),
        ]);
    }

    public function calculateCommission(float $percentage): void
    {
        $this->commission_percentage = $percentage;
        $this->commission_amount = $this->amount * ($percentage / 100);
        $this->net_amount = $this->amount - $this->commission_amount;
        $this->save();
    }

    public static function getStatusOptions(): array
    {
        return [
            'pending' => 'Pendente',
            'waiting_payment' => 'Aguardando Pagamento',
            'paid' => 'Pago',
            'expired' => 'Expirado',
            'cancelled' => 'Cancelado',
            'refunded' => 'Reembolsado',
            'processing_refund' => 'Processando Reembolso',
        ];
    }

    public static function getTypeOptions(): array
    {
        return [
            'booking_fee' => 'Taxa de Agendamento',
            'service_payment' => 'Pagamento de Serviço',
        ];
    }
}
