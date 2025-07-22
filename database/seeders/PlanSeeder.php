<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'description' => 'Plano básico para pequenos negócios',
                'price' => 29.90,
                'billing_cycle' => 'monthly',
                'features' => [
                    'agenda',
                    'clientes', 
                    'servicos',
                    'agendamentos',
                    'link_agendamento',
                    'minha_conta',
                    'minha_empresa',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Professional',
                'description' => 'Plano profissional com recursos avançados',
                'price' => 59.90,
                'billing_cycle' => 'monthly',
                'features' => [
                    'agenda',
                    'clientes',
                    'servicos',
                    'agendamentos',
                    'link_agendamento',
                    'minha_conta',
                    'minha_empresa',
                    'profissionais',
                    'pagamentos',
                    'integracoes',
                    'notificacoes',
                    'campanhas',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'description' => 'Plano empresarial com todos os recursos',
                'price' => 99.90,
                'billing_cycle' => 'monthly',
                'features' => [
                    'agenda',
                    'clientes',
                    'servicos',
                    'agendamentos',
                    'link_agendamento',
                    'minha_conta',
                    'minha_empresa',
                    'profissionais',
                    'pagamentos',
                    'integracoes',
                    'notificacoes',
                    'campanhas',
                    'suporte_ticket',
                    'relatorios_avancados',
                    'api_acesso',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            \App\Models\Plan::create($plan);
        }
    }
}
