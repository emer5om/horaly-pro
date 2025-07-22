<?php

namespace App\Console\Commands;

use App\Models\Establishment;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class DebugWhatsAppStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:whatsapp-status {establishment_id?} {--set-connected} {--set-disconnected}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug WhatsApp status for establishments';

    /**
     * Execute the console command.
     */
    public function handle(WhatsAppService $whatsAppService)
    {
        $establishmentId = $this->argument('establishment_id');
        
        if ($establishmentId) {
            $establishment = Establishment::find($establishmentId);
            if (!$establishment) {
                $this->error("Establishment with ID {$establishmentId} not found.");
                return 1;
            }
            $establishments = collect([$establishment]);
        } else {
            $establishments = Establishment::whereNotNull('whatsapp_instance_id')->get();
        }

        if ($establishments->isEmpty()) {
            $this->info('No establishments with WhatsApp instances found.');
            return 0;
        }

        foreach ($establishments as $establishment) {
            $this->info("=== Establishment: {$establishment->name} (ID: {$establishment->id}) ===");
            $this->info("Instance ID: " . ($establishment->whatsapp_instance_id ?? 'None'));
            $this->info("Instance Name: " . ($establishment->whatsapp_instance_name ?? 'None'));
            $this->info("DB Status: " . ($establishment->whatsapp_status ?? 'None'));
            
            if ($this->option('set-connected')) {
                $establishment->update(['whatsapp_status' => 'connected']);
                $this->info("✅ Status set to: connected");
            } elseif ($this->option('set-disconnected')) {
                $establishment->update(['whatsapp_status' => 'disconnected']);
                $this->info("❌ Status set to: disconnected");
            } else {
                // Check API status
                try {
                    $apiStatus = $whatsAppService->getInstanceStatus($establishment);
                    $this->info("API Status: " . json_encode($apiStatus, JSON_PRETTY_PRINT));
                } catch (\Exception $e) {
                    $this->error("API Error: " . $e->getMessage());
                }
            }
            
            $this->newLine();
        }

        return 0;
    }
}
