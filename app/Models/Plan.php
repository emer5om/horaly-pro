<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'billing_cycle',
        'features',
        'monthly_appointment_limit',
        'unlimited_appointments',
        'is_active',
        'landing_title',
        'landing_description',
        'landing_features',
        'landing_button_text',
        'landing_badge',
        'landing_featured',
        'landing_order',
        'show_on_landing',
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
        'unlimited_appointments' => 'boolean',
        'price' => 'decimal:2',
        'landing_features' => 'array',
        'landing_featured' => 'boolean',
        'show_on_landing' => 'boolean',
    ];

    public function establishments(): HasMany
    {
        return $this->hasMany(Establishment::class);
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    public function getAppointmentLimitText(): string
    {
        if ($this->unlimited_appointments) {
            return 'Ilimitado';
        }
        
        if ($this->monthly_appointment_limit) {
            return $this->monthly_appointment_limit . ' agendamentos/mês';
        }
        
        return 'Sem limite definido';
    }

    public function canCreateAppointment(int $currentMonthlyCount): bool
    {
        if ($this->unlimited_appointments) {
            return true;
        }
        
        if (!$this->monthly_appointment_limit) {
            return true;
        }
        
        return $currentMonthlyCount < $this->monthly_appointment_limit;
    }

    public function getLandingTitle(): string
    {
        return $this->landing_title ?: $this->name;
    }

    public function getLandingDescription(): string
    {
        return $this->landing_description ?: $this->description;
    }

    public function getLandingFeatures(): array
    {
        return $this->landing_features ?: $this->features;
    }

    public function getLandingButtonText(): string
    {
        return $this->landing_button_text ?: 'Escolher Plano';
    }

    public function scopeForLanding($query)
    {
        return $query->where('show_on_landing', true)
                    ->where('is_active', true)
                    ->orderBy('landing_order')
                    ->orderBy('price');
    }
}
