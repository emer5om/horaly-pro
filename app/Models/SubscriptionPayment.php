<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class SubscriptionPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'establishment_id',
        'plan_id',
        'mercadopago_payment_id',
        'external_reference',
        'amount',
        'description',
        'status',
        'mercadopago_status',
        'status_detail',
        'qr_code',
        'qr_code_base64',
        'ticket_url',
        'mercadopago_data',
        'paid_amount',
        'paid_at',
        'expires_at',
        'admin_notes',
        'admin_status',
        'subscription_starts_at',
        'subscription_ends_at',
    ];

    protected $casts = [
        'mercadopago_data' => 'array',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
        'subscription_starts_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    /**
     * Relacionamento com Establishment
     */
    public function establishment()
    {
        return $this->belongsTo(Establishment::class);
    }

    /**
     * Relacionamento com Plan
     */
    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Escopo para pagamentos pendentes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Escopo para pagamentos aprovados
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Escopo para pagamentos do período atual
     */
    public function scopeCurrentMonth($query)
    {
        return $query->whereBetween('created_at', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        ]);
    }

    /**
     * Verificar se o pagamento está expirado
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Verificar se o pagamento foi aprovado
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Verificar se o pagamento está pendente
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Formatar valor para exibição
     */
    public function getFormattedAmountAttribute(): string
    {
        return 'R$ ' . number_format($this->amount, 2, ',', '.');
    }

    /**
     * Formatar valor pago para exibição
     */
    public function getFormattedPaidAmountAttribute(): string
    {
        return 'R$ ' . number_format($this->paid_amount ?? 0, 2, ',', '.');
    }

    /**
     * Status traduzido
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pendente',
            'approved' => 'Aprovado',
            'rejected' => 'Rejeitado',
            'cancelled' => 'Cancelado',
            'refunded' => 'Reembolsado',
            default => 'Desconhecido'
        };
    }

    /**
     * Status admin traduzido
     */
    public function getAdminStatusLabelAttribute(): string
    {
        return match($this->admin_status) {
            'pending' => 'Pendente',
            'verified' => 'Verificado',
            'disputed' => 'Disputado',
            'cancelled' => 'Cancelado',
            default => 'Pendente'
        };
    }

    /**
     * Cor do status para UI
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            'cancelled' => 'gray',
            'refunded' => 'orange',
            default => 'gray'
        };
    }
}