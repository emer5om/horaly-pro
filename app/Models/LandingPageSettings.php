<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageSettings extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    protected $casts = [
        'value' => 'json',
    ];

    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, $value, string $description = null)
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'description' => $description,
            ]
        );
    }

    public static function getDefault()
    {
        return [
            'hero_title' => 'Horaly - Sistema de Agendamento',
            'hero_subtitle' => 'Gerencie seus agendamentos de forma simples e eficiente',
            'hero_description' => 'Plataforma completa para salões, barbearias, academias e outros estabelecimentos que precisam de um sistema de agendamento profissional.',
            'plans_title' => 'Escolha o Plano Ideal',
            'plans_subtitle' => 'Temos o plano perfeito para o seu negócio',
            'plans_description' => 'Experimente grátis por 7 dias e veja como nosso sistema pode transformar a gestão do seu estabelecimento.',
            'contact_title' => 'Fale Conosco',
            'contact_subtitle' => 'Tire suas dúvidas ou solicite uma demonstração',
            'contact_phone' => '(11) 99999-9999',
            'contact_email' => 'contato@horaly.com',
            'contact_address' => 'São Paulo, SP',
            'show_plans' => true,
            'show_contact' => true,
            'show_testimonials' => true,
            'primary_color' => '#3B82F6',
            'secondary_color' => '#10B981',
        ];
    }
}
