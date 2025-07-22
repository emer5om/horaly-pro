<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $appointments = [
            // Agendamentos para Barbearia do João
            [
                'establishment_id' => 1,
                'service_id' => 1, // Corte Masculino
                'customer_id' => 1, // Carlos
                'scheduled_at' => now()->addDays(1)->setTime(9, 0),
                'duration_minutes' => 30,
                'price' => 25.00,
                'status' => 'confirmed',
                'payment_status' => 'pending',
                'notes' => 'Corte baixo nas laterais',
            ],
            [
                'establishment_id' => 1,
                'service_id' => 3, // Corte + Barba
                'customer_id' => 3, // Roberto
                'scheduled_at' => now()->addDays(2)->setTime(14, 0),
                'duration_minutes' => 45,
                'price' => 35.00,
                'discount_amount' => 5.00,
                'discount_code' => 'PROMO5',
                'status' => 'pending',
                'payment_status' => 'pending',
            ],
            [
                'establishment_id' => 1,
                'service_id' => 2, // Barba
                'customer_id' => 7, // Paulo
                'scheduled_at' => now()->subDays(1)->setTime(15, 0),
                'started_at' => now()->subDays(1)->setTime(15, 5),
                'completed_at' => now()->subDays(1)->setTime(15, 25),
                'duration_minutes' => 20,
                'price' => 15.00,
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'cash',
            ],
            
            // Agendamentos para Salão da Maria
            [
                'establishment_id' => 2,
                'service_id' => 5, // Corte Feminino
                'customer_id' => 2, // Ana
                'scheduled_at' => now()->addDays(3)->setTime(10, 0),
                'duration_minutes' => 60,
                'price' => 45.00,
                'status' => 'confirmed',
                'payment_status' => 'pending',
                'notes' => 'Corte em camadas',
            ],
            [
                'establishment_id' => 2,
                'service_id' => 8, // Manicure
                'customer_id' => 4, // Fernanda
                'scheduled_at' => now()->addDays(1)->setTime(16, 0),
                'duration_minutes' => 30,
                'price' => 25.00,
                'status' => 'confirmed',
                'payment_status' => 'pending',
            ],
            [
                'establishment_id' => 2,
                'service_id' => 6, // Escova
                'customer_id' => 6, // Mariana
                'scheduled_at' => now()->subDays(2)->setTime(11, 0),
                'started_at' => now()->subDays(2)->setTime(11, 10),
                'completed_at' => now()->subDays(2)->setTime(11, 55),
                'duration_minutes' => 45,
                'price' => 30.00,
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'card',
            ],
            
            // Agendamentos para Academia Force
            [
                'establishment_id' => 3,
                'service_id' => 11, // Personal Training
                'customer_id' => 5, // Lucas
                'scheduled_at' => now()->addDays(1)->setTime(7, 0),
                'duration_minutes' => 60,
                'price' => 120.00,
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_method' => 'pix',
                'notes' => 'Foco em hipertrofia',
            ],
            [
                'establishment_id' => 3,
                'service_id' => 12, // Avaliação Física
                'customer_id' => 8, // Juliana
                'scheduled_at' => now()->addDays(5)->setTime(8, 0),
                'duration_minutes' => 45,
                'price' => 80.00,
                'status' => 'pending',
                'payment_status' => 'pending',
            ],
            [
                'establishment_id' => 3,
                'service_id' => 14, // Treino em Dupla
                'customer_id' => 1, // Carlos
                'scheduled_at' => now()->subDays(3)->setTime(18, 0),
                'started_at' => now()->subDays(3)->setTime(18, 0),
                'completed_at' => now()->subDays(3)->setTime(19, 0),
                'duration_minutes' => 60,
                'price' => 180.00,
                'discount_amount' => 30.00,
                'discount_code' => 'DUPLA30',
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'pix',
            ],
            
            // Agendamento cancelado
            [
                'establishment_id' => 2,
                'service_id' => 7, // Coloração
                'customer_id' => 3, // Roberto
                'scheduled_at' => now()->subDays(1)->setTime(14, 0),
                'duration_minutes' => 120,
                'price' => 80.00,
                'status' => 'cancelled',
                'payment_status' => 'refunded',
                'cancellation_reason' => 'Cliente cancelou por motivos pessoais',
            ],
        ];

        foreach ($appointments as $appointment) {
            \App\Models\Appointment::create($appointment);
        }
    }
}
