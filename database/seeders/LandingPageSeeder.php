<?php

namespace Database\Seeders;

use App\Models\LandingPageSettings;
use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default landing page settings
        $defaultSettings = [
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
            'show_testimonials' => false,
            'primary_color' => '#3B82F6',
            'secondary_color' => '#10B981',
        ];

        foreach ($defaultSettings as $key => $value) {
            LandingPageSettings::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'description' => 'Configuração da landing page']
            );
        }

        // Update existing plans with landing page information
        $plans = Plan::all();
        
        foreach ($plans as $index => $plan) {
            $plan->update([
                'landing_order' => $index + 1,
                'show_on_landing' => true,
                'landing_featured' => $index === 1, // Make the second plan featured
                'landing_button_text' => 'Escolher Plano',
            ]);
        }

        // Update specific plan customizations
        $starterPlan = Plan::where('name', 'like', '%Starter%')->first();
        if ($starterPlan) {
            $starterPlan->update([
                'landing_title' => 'Plano Starter',
                'landing_description' => 'Perfeito para pequenos negócios que estão começando',
                'landing_features' => [
                    'Até 100 agendamentos/mês',
                    'Gestão de clientes',
                    'Gestão de serviços',
                    'Painel administrativo',
                    'Suporte por email'
                ],
                'landing_badge' => 'Para Começar',
                'landing_order' => 1,
            ]);
        }

        $professionalPlan = Plan::where('name', 'like', '%Professional%')->first();
        if ($professionalPlan) {
            $professionalPlan->update([
                'landing_title' => 'Plano Professional',
                'landing_description' => 'Ideal para negócios em crescimento que precisam de mais recursos',
                'landing_features' => [
                    'Até 500 agendamentos/mês',
                    'Gestão de clientes',
                    'Gestão de serviços',
                    'Relatórios avançados',
                    'Notificações WhatsApp',
                    'Integrações',
                    'Suporte prioritário'
                ],
                'landing_badge' => 'Mais Popular',
                'landing_featured' => true,
                'landing_order' => 2,
            ]);
        }

        $enterprisePlan = Plan::where('name', 'like', '%Enterprise%')->first();
        if ($enterprisePlan) {
            $enterprisePlan->update([
                'landing_title' => 'Plano Enterprise',
                'landing_description' => 'Para grandes estabelecimentos que precisam de recursos completos',
                'landing_features' => [
                    'Agendamentos ilimitados',
                    'Gestão de clientes',
                    'Gestão de serviços',
                    'Relatórios completos',
                    'Notificações WhatsApp',
                    'Integrações avançadas',
                    'Analytics detalhado',
                    'Suporte 24/7',
                    'Marca personalizada'
                ],
                'landing_badge' => 'Completo',
                'landing_order' => 3,
            ]);
        }
    }
}
