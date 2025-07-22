<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendAppointmentReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $appointment;
    public $delay;

    /**
     * Create a new job instance.
     */
    public function __construct(Appointment $appointment, int $delay = 0)
    {
        $this->appointment = $appointment;
        $this->delay = $delay;
        
        // Set the delay for when this job should run
        if ($delay > 0) {
            $this->delay($delay);
        }
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Reload appointment to get latest data
            $appointment = $this->appointment->fresh(['establishment', 'service']);
            
            // Check if appointment still exists and is confirmed
            if (!$appointment || $appointment->status !== 'confirmed') {
                Log::info('Appointment reminder job cancelled - appointment not confirmed', [
                    'appointment_id' => $this->appointment->id,
                    'current_status' => $appointment?->status ?? 'deleted',
                ]);
                return;
            }
            
            $establishment = $appointment->establishment;
            
            // Check if WhatsApp is connected and reminder is enabled
            if (!$establishment->whatsapp_connected || !$establishment->reminder_enabled) {
                Log::info('Appointment reminder job cancelled - WhatsApp not connected or reminder disabled', [
                    'appointment_id' => $appointment->id,
                    'whatsapp_connected' => $establishment->whatsapp_connected,
                    'reminder_enabled' => $establishment->reminder_enabled,
                ]);
                return;
            }
            
            // Check if reminder was already sent
            if ($appointment->reminders()->where('type', 'reminder')->exists()) {
                Log::info('Appointment reminder already sent', [
                    'appointment_id' => $appointment->id,
                ]);
                return;
            }
            
            // Send reminder
            $whatsappService = new WhatsAppService();
            $message = $this->buildReminderMessage($appointment);
            
            $customerPhone = $appointment->customer ? $appointment->customer->phone : null;
            if (!$customerPhone) {
                Log::warning('Cannot send reminder - no customer phone', [
                    'appointment_id' => $appointment->id,
                ]);
                return;
            }
            
            $whatsappService->sendMessage($establishment, $customerPhone, $message);
            
            // Log the sent reminder
            $appointment->reminders()->create([
                'type' => 'reminder',
                'sent_at' => now(),
                'message' => $message,
            ]);
            
            Log::info('Appointment reminder sent successfully', [
                'appointment_id' => $appointment->id,
                'customer_phone' => $customerPhone,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send appointment reminder', [
                'appointment_id' => $this->appointment->id,
                'error' => $e->getMessage(),
            ]);
            
            // Don't retry if it's a WhatsApp connection error
            if (str_contains($e->getMessage(), 'WhatsApp instance not connected')) {
                $this->fail($e);
                return;
            }
            
            throw $e;
        }
    }
    
    /**
     * Build reminder message
     */
    private function buildReminderMessage(Appointment $appointment): string
    {
        $establishment = $appointment->establishment;
        $service = $appointment->service;
        
        $message = $establishment->whatsapp_reminder_message ?: 
            "🕐 *Lembrete de Agendamento*\n\nOlá {cliente}, \n\nVocê tem um agendamento marcado para:\n📅 *{data}* às *{hora}*\n✂️ *Serviço:* {servico}\n\n📍 *Local:* {estabelecimento}\n📞 *Contato:* {telefone}\n\n⏰ *Chegue 15 minutos antes do horário!*\n\nAguardamos você! 😊";
        
        $replacements = [
            '{cliente}' => $appointment->customer ? $appointment->customer->name : 'Cliente',
            '{data}' => Carbon::parse($appointment->scheduled_at)->format('d/m/Y'),
            '{hora}' => Carbon::parse($appointment->scheduled_at)->format('H:i'),
            '{servico}' => $service->name,
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone,
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }
}