<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Establishment;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SendWelcomeMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'welcome:send {--test : Run in test mode}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send welcome messages to new customers via WhatsApp';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting welcome message sending process...');
        
        $testMode = $this->option('test');
        
        // Get all establishments with WhatsApp enabled and welcome messages enabled
        $establishments = Establishment::where('whatsapp_connected', true)
            ->where('welcome_enabled', true)
            ->whereNotNull('whatsapp_instance_id')
            ->get();
        
        $this->info("Found {$establishments->count()} establishments with welcome messages enabled");
        
        $totalSent = 0;
        $totalErrors = 0;
        
        foreach ($establishments as $establishment) {
            $this->info("Processing establishment: {$establishment->name}");
            
            // Find new customers (first appointment) from the last 24 hours
            $appointments = Appointment::where('establishment_id', $establishment->id)
                ->where('status', 'confirmed')
                ->where('created_at', '>=', now()->subDay())
                ->whereHas('customer', function ($query) use ($establishment) {
                    // Only customers with their first appointment at this establishment
                    $query->whereDoesntHave('appointments', function ($subQuery) use ($establishment) {
                        $subQuery->where('establishment_id', $establishment->id)
                            ->where('id', '!=', DB::raw('appointments.id'))
                            ->where('created_at', '<', DB::raw('appointments.created_at'));
                    });
                })
                ->whereDoesntHave('reminders', function ($query) {
                    $query->where('type', 'welcome');
                })
                ->with(['customer', 'service'])
                ->get();
            
            $this->info("Found {$appointments->count()} new customers to send welcome messages to");
            
            foreach ($appointments as $appointment) {
                try {
                    if ($testMode) {
                        $this->info("TEST MODE: Would send welcome message to {$appointment->customer_name} ({$appointment->customer_phone})");
                        continue;
                    }
                    
                    $sent = $this->sendWelcomeMessage($establishment, $appointment);
                    
                    if ($sent) {
                        $totalSent++;
                        $this->info("✓ Welcome message sent to {$appointment->customer_name}");
                        
                        // Log the sent welcome message
                        $appointment->reminders()->create([
                            'type' => 'welcome',
                            'sent_at' => now(),
                            'message' => $this->buildWelcomeMessage($establishment, $appointment),
                        ]);
                    } else {
                        $totalErrors++;
                        $this->error("✗ Failed to send welcome message to {$appointment->customer_name}");
                    }
                    
                    // Small delay to avoid overwhelming the API
                    sleep(1);
                    
                } catch (\Exception $e) {
                    $totalErrors++;
                    $this->error("✗ Error sending welcome message to {$appointment->customer_name}: {$e->getMessage()}");
                }
            }
        }
        
        $this->info("Welcome message process completed:");
        $this->info("- Total sent: {$totalSent}");
        $this->info("- Total errors: {$totalErrors}");
        
        return Command::SUCCESS;
    }
    
    /**
     * Send welcome message
     */
    private function sendWelcomeMessage(Establishment $establishment, Appointment $appointment): bool
    {
        try {
            $whatsappService = new WhatsAppService();
            $message = $this->buildWelcomeMessage($establishment, $appointment);
            
            $whatsappService->sendMessage($establishment, $appointment->customer_phone, $message);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send welcome message', [
                'establishment_id' => $establishment->id,
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }
    
    /**
     * Build welcome message
     */
    private function buildWelcomeMessage(Establishment $establishment, Appointment $appointment): string
    {
        $message = $establishment->whatsapp_welcome_message ?: 
            "🙏 *Bem-vindo(a) ao {estabelecimento}!*\n\nOlá {cliente}, \n\nÉ um prazer tê-lo(a) como nosso cliente! 😊\n\n🌟 *Nossos serviços:*\n{lista_servicos}\n\n📅 *Para agendar:*\n📞 {telefone}\n🌐 {link_agendamento}\n\n📍 *Endereço:* {endereco}\n\nAguardamos sua visita! ✨";
        
        // Get establishment services for the list
        $services = $establishment->services()->where('is_active', true)->get();
        $servicesList = $services->map(function ($service) {
            return "• {$service->name} - R$ " . number_format($service->price, 2, ',', '.');
        })->implode("\n");
        
        $replacements = [
            '{cliente}' => $appointment->customer_name,
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone,
            '{endereco}' => $establishment->address,
            '{lista_servicos}' => $servicesList ?: 'Consulte nossos serviços disponíveis!',
            '{link_agendamento}' => url("/{$establishment->booking_slug}"),
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }
}
