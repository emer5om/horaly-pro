<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\User;
use App\Models\Appointment;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $establishments = User::where('role', 'establishment')->get();
        
        foreach ($establishments as $establishment) {
            // Get first appointment for this establishment if exists
            $appointment = Appointment::where('establishment_id', $establishment->id)->first();
            
            // Create sample notifications
            $notifications = [
                [
                    'title' => '🎉 Maravilha! João confirmou seu agendamento',
                    'message' => 'Agendamento para Corte de Cabelo em ' . now()->addDay()->format('d/m/Y \à\s H:i'),
                    'type' => 'appointment_confirmed',
                    'read' => false,
                    'customer_name' => 'João Silva',
                ],
                [
                    'title' => '⏰ Atenção! Novo agendamento de Maria aguardando confirmação',
                    'message' => 'Agendamento para Manicure em ' . now()->addDays(2)->format('d/m/Y \à\s H:i'),
                    'type' => 'appointment_pending',
                    'read' => false,
                    'customer_name' => 'Maria Santos',
                ],
                [
                    'title' => '✅ Sucesso! Atendimento de Carlos concluído',
                    'message' => 'Atendimento de Barba foi finalizado com sucesso',
                    'type' => 'appointment_completed',
                    'read' => true,
                    'customer_name' => 'Carlos Oliveira',
                ],
            ];
            
            foreach ($notifications as $notificationData) {
                Notification::create([
                    'establishment_id' => $establishment->id,
                    'appointment_id' => $appointment?->id,
                    'title' => $notificationData['title'],
                    'message' => $notificationData['message'],
                    'type' => $notificationData['type'],
                    'read' => $notificationData['read'],
                    'customer_name' => $notificationData['customer_name'],
                ]);
            }
        }
    }
}
