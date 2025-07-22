<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Serviços para Barbearia do João
        $barbeariaServices = [
            ['name' => 'Corte Masculino', 'description' => 'Corte tradicional masculino', 'price' => 25.00, 'duration_minutes' => 30],
            ['name' => 'Barba', 'description' => 'Aparar e modelar barba', 'price' => 15.00, 'duration_minutes' => 20],
            ['name' => 'Corte + Barba', 'description' => 'Pacote completo', 'price' => 35.00, 'duration_minutes' => 45, 'has_promotion' => true, 'promotion_price' => 30.00],
            ['name' => 'Sobrancelha', 'description' => 'Aparar sobrancelha', 'price' => 10.00, 'duration_minutes' => 15],
        ];

        // Serviços para Salão da Maria
        $salaoServices = [
            ['name' => 'Corte Feminino', 'description' => 'Corte e modelagem feminina', 'price' => 45.00, 'duration_minutes' => 60],
            ['name' => 'Escova', 'description' => 'Escova e finalização', 'price' => 30.00, 'duration_minutes' => 45],
            ['name' => 'Coloração', 'description' => 'Tintura e coloração', 'price' => 80.00, 'duration_minutes' => 120],
            ['name' => 'Manicure', 'description' => 'Cuidados com as unhas das mãos', 'price' => 25.00, 'duration_minutes' => 30],
            ['name' => 'Pedicure', 'description' => 'Cuidados com as unhas dos pés', 'price' => 35.00, 'duration_minutes' => 45],
            ['name' => 'Hidratação', 'description' => 'Tratamento hidratante para cabelos', 'price' => 40.00, 'duration_minutes' => 60],
        ];

        // Serviços para Academia Force
        $academiaServices = [
            ['name' => 'Personal Training', 'description' => 'Treino personalizado individual', 'price' => 120.00, 'duration_minutes' => 60],
            ['name' => 'Avaliação Física', 'description' => 'Análise completa do condicionamento físico', 'price' => 80.00, 'duration_minutes' => 45],
            ['name' => 'Consultoria Nutricional', 'description' => 'Orientação nutricional personalizada', 'price' => 100.00, 'duration_minutes' => 60],
            ['name' => 'Treino em Dupla', 'description' => 'Personal training para duas pessoas', 'price' => 180.00, 'duration_minutes' => 60, 'has_promotion' => true, 'promotion_price' => 150.00],
        ];

        // Inserir serviços da barbearia
        foreach ($barbeariaServices as $service) {
            \App\Models\Service::create(array_merge($service, ['establishment_id' => 1]));
        }

        // Inserir serviços do salão
        foreach ($salaoServices as $service) {
            \App\Models\Service::create(array_merge($service, ['establishment_id' => 2]));
        }

        // Inserir serviços da academia
        foreach ($academiaServices as $service) {
            \App\Models\Service::create(array_merge($service, ['establishment_id' => 3]));
        }
    }
}
