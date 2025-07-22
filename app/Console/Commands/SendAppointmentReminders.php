<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Establishment;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendAppointmentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminders:send {--test : Run in test mode}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send appointment reminders via WhatsApp';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting appointment reminder sending process...');
        
        $testMode = $this->option('test');
        
        // Get all establishments with WhatsApp enabled and reminder enabled
        $establishments = Establishment::where('whatsapp_connected', true)
            ->where('reminder_enabled', true)
            ->whereNotNull('whatsapp_instance_id')
            ->get();
        
        $this->info("Found {$establishments->count()} establishments with reminders enabled");
        
        $totalSent = 0;
        $totalErrors = 0;
        
        foreach ($establishments as $establishment) {
            $this->info("Processing establishment: {$establishment->name}");
            
            // Calculate reminder time based on establishment settings
            $reminderHours = $establishment->reminder_hours_before ?? 24;
            $reminderTime = now()->addHours($reminderHours);
            
            // Get appointments for the reminder time
            $appointments = Appointment::where('establishment_id', $establishment->id)
                ->where('status', 'confirmed')
                ->whereDate('date', $reminderTime->format('Y-m-d'))
                ->whereTime('time', '>=', $reminderTime->format('H:i:s'))
                ->whereTime('time', '<=', $reminderTime->addHour()->format('H:i:s'))
                ->whereDoesntHave('reminders', function ($query) use ($reminderTime) {
                    $query->where('type', 'reminder')
                        ->whereDate('sent_at', $reminderTime->format('Y-m-d'));
                })
                ->get();
            
            $this->info("Found {$appointments->count()} appointments to send reminders for");
            
            foreach ($appointments as $appointment) {
                try {
                    if ($testMode) {
                        $this->info("TEST MODE: Would send reminder to {$appointment->customer_name} ({$appointment->customer_phone})");
                        continue;
                    }
                    
                    $sent = $this->sendReminder($establishment, $appointment);
                    
                    if ($sent) {
                        $totalSent++;
                        $this->info("✓ Reminder sent to {$appointment->customer_name}");
                        
                        // Log the sent reminder
                        $appointment->reminders()->create([
                            'type' => 'reminder',
                            'sent_at' => now(),
                            'message' => $this->buildReminderMessage($establishment, $appointment),
                        ]);
                    } else {
                        $totalErrors++;
                        $this->error("✗ Failed to send reminder to {$appointment->customer_name}");
                    }
                    
                    // Small delay to avoid overwhelming the API
                    sleep(1);
                    
                } catch (\Exception $e) {
                    $totalErrors++;
                    $this->error("✗ Error sending reminder to {$appointment->customer_name}: {$e->getMessage()}");
                }
            }
        }
        
        $this->info("Reminder process completed:");
        $this->info("- Total sent: {$totalSent}");
        $this->info("- Total errors: {$totalErrors}");
        
        return Command::SUCCESS;
    }
    
    /**
     * Send reminder message
     */
    private function sendReminder(Establishment $establishment, Appointment $appointment): bool
    {
        try {
            $whatsappService = new WhatsAppService();
            $message = $this->buildReminderMessage($establishment, $appointment);
            
            $whatsappService->sendMessage($establishment, $appointment->customer_phone, $message);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send appointment reminder', [
                'establishment_id' => $establishment->id,
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }
    
    /**
     * Build reminder message
     */
    private function buildReminderMessage(Establishment $establishment, Appointment $appointment): string
    {
        $service = $appointment->service;
        
        $message = $establishment->whatsapp_reminder_message ?: 
            "🕐 *Lembrete de Agendamento*\n\nOlá {cliente}, \n\nVocê tem um agendamento marcado para:\n📅 *{data}* às *{hora}*\n✂️ *Serviço:* {servico}\n\n📍 *Local:* {estabelecimento}\n📞 *Contato:* {telefone}\n\n⏰ *Chegue 15 minutos antes do horário!*\n\nAguardamos você! 😊";
        
        $replacements = [
            '{cliente}' => $appointment->customer_name,
            '{data}' => Carbon::parse($appointment->date)->format('d/m/Y'),
            '{hora}' => $appointment->time,
            '{servico}' => $service->name,
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone,
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }
}
