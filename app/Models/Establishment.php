<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Establishment extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'name',
        'email',
        'phone',
        'address',
        'slug',
        'logo',
        'banner',
        'description',
        'slogan',
        'colors',
        'theme',
        'working_hours',
        'blocked_dates',
        'blocked_times',
        'allow_rescheduling',
        'allow_cancellation',
        'reschedule_advance_hours',
        'cancel_advance_hours',
        'slots_per_hour',
        'payment_enabled',
        'payment_methods',
        'mercadopago_access_token',
        'accepted_payment_methods',
        'booking_fee_enabled',
        'booking_fee_type',
        'booking_fee_amount',
        'booking_fee_percentage',
        'whatsapp_instance_id',
        'facebook_pixel_id',
        'google_analytics_id',
        'google_tag_id',
        'is_active',
        'is_blocked',
        'plan_expires_at',
        'status',
        'booking_slug',
        'booking_primary_color',
        'booking_secondary_color',
        'booking_slogan',
        'booking_logo',
        'booking_banner',
        'booking_theme',
        'required_fields',
        'receive_notifications',
        'notification_settings',
        'trust_list_active',
        'blacklist_active',
        'trust_list',
        'blacklist',
        'whatsapp_connected',
        'whatsapp_reminder_message',
        'whatsapp_confirmation_message',
        'whatsapp_birthday_message',
        'whatsapp_promotion_message',
        'whatsapp_cancellation_message',
        'whatsapp_welcome_message',
        // New WhatsApp fields
        'whatsapp_instance_name',
        'whatsapp_status',
        'whatsapp_config',
        'whatsapp_connected_at',
        'whatsapp_disconnected_at',
        'notifications_enabled',
        'notification_templates',
        'notification_settings',
        // Subscription fields
        'subscription_status',
        'efipay_subscription_id',
        'efipay_plan_id',
        'subscription_started_at',
        'subscription_expires_at',
        'subscription_updated_at',
        'trial_ends_at',
        'subscription_value',
        'subscription_plan_name',
        'subscription_metadata',
        'earliest_booking_time',
        'latest_booking_time',
    ];

    protected $casts = [
        'colors' => 'array',
        'working_hours' => 'array',
        'blocked_dates' => 'array',
        'blocked_times' => 'array',
        'allow_rescheduling' => 'boolean',
        'allow_cancellation' => 'boolean',
        'payment_enabled' => 'boolean',
        'payment_methods' => 'array',
        'accepted_payment_methods' => 'array',
        'booking_fee_enabled' => 'boolean',
        'booking_fee_amount' => 'decimal:2',
        'booking_fee_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'is_blocked' => 'boolean',
        'plan_expires_at' => 'datetime',
        'required_fields' => 'array',
        'receive_notifications' => 'boolean',
        'notification_settings' => 'array',
        'trust_list_active' => 'boolean',
        'blacklist_active' => 'boolean',
        'trust_list' => 'array',
        'blacklist' => 'array',
        'whatsapp_connected' => 'boolean',
        // New WhatsApp casts
        'whatsapp_config' => 'array',
        'whatsapp_connected_at' => 'datetime',
        'whatsapp_disconnected_at' => 'datetime',
        'notifications_enabled' => 'boolean',
        'notification_templates' => 'array',
        'notification_settings' => 'array',
        // Subscription casts
        'subscription_started_at' => 'datetime',
        'subscription_expires_at' => 'datetime',
        'subscription_updated_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'subscription_metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function customers()
    {
        return $this->belongsToMany(Customer::class, 'customer_establishments');
    }

    public function blockedDates(): HasMany
    {
        return $this->hasMany(BlockedDate::class);
    }

    public function blockedTimes(): HasMany
    {
        return $this->hasMany(BlockedTime::class);
    }

    public function coupons(): HasMany
    {
        return $this->hasMany(Coupon::class);
    }


    public function hasFeature(string $feature): bool
    {
        return $this->plan?->hasFeature($feature) ?? false;
    }

    /**
     * Check if establishment is in trial period
     */
    public function isInTrial(): bool
    {
        return $this->subscription_status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }

    /**
     * Check if trial has expired
     */
    public function hasTrialExpired(): bool
    {
        return $this->subscription_status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isPast();
    }

    /**
     * Check if subscription is active
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscription_status === 'active' && 
               $this->subscription_expires_at && 
               $this->subscription_expires_at->isFuture();
    }

    /**
     * Check if subscription has expired
     */
    public function hasExpiredSubscription(): bool
    {
        return in_array($this->subscription_status, ['overdue', 'cancelled', 'suspended']) ||
               ($this->subscription_expires_at && $this->subscription_expires_at->isPast());
    }

    /**
     * Check if establishment can use the platform
     */
    public function canUse(): bool
    {
        return $this->isInTrial() || $this->hasActiveSubscription();
    }

    /**
     * Get days remaining in trial
     */
    public function getTrialDaysRemaining(): int
    {
        if (!$this->isInTrial()) {
            return 0;
        }

        return now()->diffInDays($this->trial_ends_at, false);
    }

    /**
     * Get subscription status for display
     */
    public function getSubscriptionStatusLabel(): string
    {
        return match ($this->subscription_status) {
            'trial' => 'Período de Teste',
            'active' => 'Ativo',
            'suspended' => 'Suspenso',
            'cancelled' => 'Cancelado',
            'overdue' => 'Em Atraso',
            default => 'Indefinido'
        };
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($establishment) {
            // Set default WhatsApp message templates when creating a new establishment
            if (empty($establishment->whatsapp_reminder_message)) {
                $establishment->whatsapp_reminder_message = '🕐 *Lembrete de Agendamento*

Olá {{cliente}}, 

Você tem um agendamento marcado para:
📅 *{{data}}* às *{{hora}}*
✂️ *Serviço:* {{servico}}

📍 *Local:* {{estabelecimento}}
📞 *Contato:* {{telefone}}

⏰ *Chegue 15 minutos antes do horário!*

Aguardamos você! 😊';
            }

            if (empty($establishment->whatsapp_confirmation_message)) {
                $establishment->whatsapp_confirmation_message = '✅ *Agendamento Confirmado*

Olá {{cliente}}, 

Seu agendamento foi confirmado com sucesso!

📅 *Data:* {{data}}
🕐 *Horário:* {{hora}}
✂️ *Serviço:* {{servico}}
💰 *Valor:* {{valor}}

📍 *{{estabelecimento}}*
📞 *{{telefone}}*

Aguardamos você! 😊';
            }

            if (empty($establishment->whatsapp_birthday_message)) {
                $establishment->whatsapp_birthday_message = '🎉 *Parabéns pelo seu aniversário!*

Olá {{cliente}}, 

A equipe do *{{estabelecimento}}* deseja um feliz aniversário! 🎂

🎁 *Oferta especial de aniversário:*
*15% de desconto* em qualquer serviço até o final do mês!

📅 Agende já: {{telefone}}
📍 {{endereco}}

Comemore conosco! 🥳✨';
            }

            if (empty($establishment->whatsapp_promotion_message)) {
                $establishment->whatsapp_promotion_message = '🔥 *PROMOÇÃO ESPECIAL*

Olá {{cliente}}, 

Não perca esta oportunidade incrível no *{{estabelecimento}}*!

💰 *{{titulo_promocao}}*
{{descricao_promocao}}

⏰ *Válido até:* {{data_validade}}
📅 *Agende já:* {{telefone}}

📍 {{endereco}}

Corre que é por tempo limitado! 🏃‍♀️💨';
            }

            if (empty($establishment->whatsapp_cancellation_message)) {
                $establishment->whatsapp_cancellation_message = '❌ *Agendamento Cancelado*

Olá {{cliente}}, 

Seu agendamento foi cancelado:

📅 *Data:* {{data}}
🕐 *Horário:* {{hora}}
✂️ *Serviço:* {{servico}}

😔 Sentimos muito! Para reagendar entre em contato:
📞 {{telefone}}

Esperamos vê-lo em breve! 🙏';
            }

            if (empty($establishment->whatsapp_welcome_message)) {
                $establishment->whatsapp_welcome_message = '🙏 *Bem-vindo(a) ao {{estabelecimento}}!*

Olá {{cliente}}, 

É um prazer tê-lo(a) como nosso cliente! 😊

🌟 *Nossos serviços:*
{{lista_servicos}}

📅 *Para agendar:*
📞 {{telefone}}
🌐 {{link_agendamento}}

📍 *Endereço:* {{endereco}}

Aguardamos sua visita! ✨';
            }
        });
    }
}
