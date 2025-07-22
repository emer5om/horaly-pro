<?php

namespace App\Jobs;

use App\Models\CampaignMessage;
use App\Services\WhatsAppService;
use App\Services\CampaignService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class SendCampaignMessage implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;
    public int $maxExceptions = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public CampaignMessage $campaignMessage
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService, CampaignService $campaignService): void
    {
        try {
            // Check if campaign is still running
            if (!$this->campaignMessage->campaign->isActive()) {
                Log::info('Skipping campaign message - campaign not active', [
                    'campaign_id' => $this->campaignMessage->campaign_id,
                    'message_id' => $this->campaignMessage->id,
                ]);
                return;
            }

            // Check if message is still pending
            if (!$this->campaignMessage->isPending()) {
                Log::info('Skipping campaign message - not pending', [
                    'message_id' => $this->campaignMessage->id,
                    'status' => $this->campaignMessage->status,
                ]);
                return;
            }

            // Send WhatsApp message
            $result = $whatsAppService->sendMessage(
                $this->campaignMessage->campaign->establishment,
                $this->campaignMessage->phone,
                $this->campaignMessage->message_content
            );

            if ($result['success'] === true) {
                $this->campaignMessage->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'whatsapp_response' => $result,
                ]);

                Log::info('Campaign message sent successfully', [
                    'message_id' => $this->campaignMessage->id,
                    'phone' => $this->campaignMessage->phone,
                    'message_id_whatsapp' => $result['message_id'] ?? null,
                ]);
            } else {
                // Message failed to send - mark as failed immediately, don't retry
                $this->campaignMessage->update([
                    'status' => 'failed',
                    'error_message' => $result['error'] ?? 'Unknown error',
                    'whatsapp_response' => $result,
                ]);

                Log::warning('Campaign message failed - number invalid or API error', [
                    'message_id' => $this->campaignMessage->id,
                    'phone' => $this->campaignMessage->phone,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                // Don't throw exception - this is not a retryable error
                return;
            }

        } catch (Exception $e) {
            $this->campaignMessage->increment('retry_count');
            
            Log::error('Campaign message failed', [
                'message_id' => $this->campaignMessage->id,
                'phone' => $this->campaignMessage->phone,
                'retry_count' => $this->campaignMessage->retry_count,
                'error' => $e->getMessage(),
            ]);

            // If this is the final attempt, mark as failed
            if ($this->campaignMessage->retry_count >= $this->tries) {
                $this->campaignMessage->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }

            // Re-throw to trigger retry mechanism
            throw $e;
        }

        // Update campaign statistics
        $campaignService->updateCampaignStats($this->campaignMessage->campaign);
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error('Campaign message job failed permanently', [
            'message_id' => $this->campaignMessage->id,
            'phone' => $this->campaignMessage->phone,
            'error' => $exception->getMessage(),
        ]);

        $this->campaignMessage->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);

        // Update campaign statistics
        app(CampaignService::class)->updateCampaignStats($this->campaignMessage->campaign);
    }
}
