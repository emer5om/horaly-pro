<?php

namespace App\Console\Commands;

use App\Models\Establishment;
use Illuminate\Console\Command;

class CheckTrialStatus extends Command
{
    protected $signature = 'check:trial-status {id?}';
    protected $description = 'Check trial status for establishment';

    public function handle()
    {
        $id = $this->argument('id') ?? 5;
        
        $establishment = Establishment::find($id);
        
        if (!$establishment) {
            $this->error("Establishment with ID {$id} not found.");
            return;
        }

        $this->info("Establishment: {$establishment->name}");
        $this->info("Plan ID: {$establishment->plan_id}");
        $this->info("Subscription Status: {$establishment->subscription_status}");
        $this->info("Trial Ends At: {$establishment->trial_ends_at}");
        $this->info("Subscription Started At: {$establishment->subscription_started_at}");
        $this->info("Is In Trial: " . ($establishment->isInTrial() ? 'YES' : 'NO'));
        $this->info("Can Use: " . ($establishment->canUse() ? 'YES' : 'NO'));
        
        if ($establishment->isInTrial()) {
            $this->info("Days Remaining: {$establishment->getTrialDaysRemaining()}");
        }
    }
}