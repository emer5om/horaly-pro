<?php

namespace App\Jobs;

use App\Models\Establishment;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendWhatsAppMessage implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Establishment $establishment,
        public string $phone,
        public string $message,
        public string $messageType = 'notification'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService): void
    {
        try {
            // Check if WhatsApp is connected before sending
            if ($this->establishment->whatsapp_status !== 'connected') {
                Log::warning('WhatsApp not connected, skipping message', [
                    'establishment_id' => $this->establishment->id,
                    'message_type' => $this->messageType,
                    'phone' => $this->phone
                ]);
                return;
            }

            $whatsAppService->sendMessage($this->establishment, $this->phone, $this->message);
            
            Log::info('WhatsApp message sent successfully', [
                'establishment_id' => $this->establishment->id,
                'message_type' => $this->messageType,
                'phone' => $this->phone
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp message', [
                'establishment_id' => $this->establishment->id,
                'message_type' => $this->messageType,
                'phone' => $this->phone,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
}
