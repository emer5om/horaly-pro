<?php

namespace App\Console\Commands;

use App\Services\CampaignService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessCampaignMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'campaigns:process-messages';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending campaign messages and dispatch jobs';

    /**
     * Execute the console command.
     */
    public function handle(CampaignService $campaignService)
    {
        $this->info('Processing pending campaign messages...');
        
        try {
            $campaignService->processPendingCampaignMessages();
            $this->info('Campaign messages processed successfully.');
        } catch (\Exception $e) {
            $this->error('Error processing campaign messages: ' . $e->getMessage());
            Log::error('Command ProcessCampaignMessages failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
