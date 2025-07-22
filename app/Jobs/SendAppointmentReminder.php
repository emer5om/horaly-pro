<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Models\Establishment;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendAppointmentReminder implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Appointment $appointment
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService): void
    {
        try {
            $establishment = $this->appointment->establishment;
            
            // Check if reminder messages are enabled
            if (!$establishment->reminder_enabled || $establishment->whatsapp_status !== 'connected') {
                Log::info('Reminder message skipped', [
                    'appointment_id' => $this->appointment->id,
                    'establishment_id' => $establishment->id,
                    'enabled' => $establishment->reminder_enabled,
                    'whatsapp_status' => $establishment->whatsapp_status
                ]);
                return;
            }

            // Check if appointment is still valid (not cancelled)
            if ($this->appointment->status === 'cancelled') {
                Log::info('Reminder skipped for cancelled appointment', [
                    'appointment_id' => $this->appointment->id
                ]);
                return;
            }

            // Build the reminder message from database template
            $message = $this->buildReminderMessage($establishment, $this->appointment);
            
            if (!$message) {
                Log::warning('No reminder message template found', [
                    'appointment_id' => $this->appointment->id,
                    'establishment_id' => $establishment->id
                ]);
                return;
            }

            $whatsAppService->sendMessage(
                $establishment, 
                $this->appointment->customer_phone, 
                $message
            );
            
            Log::info('Appointment reminder sent successfully', [
                'appointment_id' => $this->appointment->id,
                'establishment_id' => $establishment->id,
                'customer_phone' => $this->appointment->customer_phone
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send appointment reminder', [
                'appointment_id' => $this->appointment->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    private function buildReminderMessage(Establishment $establishment, Appointment $appointment): ?string
    {
        $template = $establishment->whatsapp_reminder_message;
        
        if (!$template) {
            return null;
        }

        // Replace placeholders with actual data
        $replacements = [
            '{cliente}' => $appointment->customer_name ?? 'Cliente',
            '{data}' => $appointment->date ? \Carbon\Carbon::parse($appointment->date)->format('d/m/Y') : '',
            '{hora}' => $appointment->time ?? '',
            '{servico}' => $appointment->service_name ?? '',
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone ?? '',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
}
