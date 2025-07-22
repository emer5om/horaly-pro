<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Models\Establishment;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendAppointmentConfirmation implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Appointment $appointment
    ) {
        // Load necessary relationships if not already loaded
        if (!$this->appointment->relationLoaded('customer')) {
            $this->appointment->load('customer');
        }
        if (!$this->appointment->relationLoaded('service')) {
            $this->appointment->load('service');
        }
    }

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService): void
    {
        try {
            $establishment = $this->appointment->establishment;
            
            // Check if confirmation messages are enabled
            if (!$establishment->confirmation_enabled || $establishment->whatsapp_status !== 'connected') {
                Log::info('Confirmation message skipped', [
                    'appointment_id' => $this->appointment->id,
                    'establishment_id' => $establishment->id,
                    'enabled' => $establishment->confirmation_enabled,
                    'whatsapp_status' => $establishment->whatsapp_status
                ]);
                return;
            }

            // Build the confirmation message from database template
            $message = $this->buildConfirmationMessage($establishment, $this->appointment);
            
            if (!$message) {
                Log::warning('No confirmation message template found', [
                    'appointment_id' => $this->appointment->id,
                    'establishment_id' => $establishment->id
                ]);
                return;
            }

            // Get customer phone from relationship
            $customerPhone = $this->appointment->customer?->phone;
            
            // Validate phone number before sending
            if (!$customerPhone) {
                Log::warning('Cannot send confirmation: customer phone is null', [
                    'appointment_id' => $this->appointment->id,
                    'establishment_id' => $establishment->id,
                    'customer_name' => $this->appointment->customer?->name,
                    'customer_id' => $this->appointment->customer_id
                ]);
                return;
            }

            $whatsAppService->sendMessage(
                $establishment, 
                $customerPhone, 
                $message
            );
            
            Log::info('Appointment confirmation sent successfully', [
                'appointment_id' => $this->appointment->id,
                'establishment_id' => $establishment->id,
                'customer_phone' => $customerPhone
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send appointment confirmation', [
                'appointment_id' => $this->appointment->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    private function buildConfirmationMessage(Establishment $establishment, Appointment $appointment): ?string
    {
        $template = $establishment->whatsapp_confirmation_message;
        
        if (!$template) {
            return null;
        }

        // Replace placeholders with actual data
        $replacements = [
            '{cliente}' => $appointment->customer?->name ?? 'Cliente',
            '{data}' => $appointment->scheduled_at ? \Carbon\Carbon::parse($appointment->scheduled_at)->format('d/m/Y') : '',
            '{hora}' => $appointment->scheduled_at ? \Carbon\Carbon::parse($appointment->scheduled_at)->format('H:i') : '',
            '{servico}' => $appointment->service?->name ?? '',
            '{valor}' => $appointment->price ? 'R$ ' . number_format($appointment->price, 2, ',', '.') : '',
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone ?? '',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
}
