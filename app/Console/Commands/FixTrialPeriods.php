<?php

namespace App\Console\Commands;

use App\Models\Establishment;
use Illuminate\Console\Command;

class FixTrialPeriods extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:trial-periods';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix establishments without proper trial period setup';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing trial periods for establishments...');

        // Find establishments that should have trial but don't have trial_ends_at set
        $establishments = Establishment::where('subscription_status', 'trial')
            ->whereNull('trial_ends_at')
            ->get();

        if ($establishments->isEmpty()) {
            $this->info('No establishments found that need fixing.');
            return;
        }

        $this->info("Found {$establishments->count()} establishments to fix.");

        $trialDays = config('efipay.subscription.trial_days', 7);
        $activePlan = \App\Models\Plan::where('is_active', true)->first();
        
        if (!$activePlan) {
            $this->error('No active plan found in the system.');
            return;
        }

        foreach ($establishments as $establishment) {
            $establishment->update([
                'trial_ends_at' => now()->addDays($trialDays),
                'subscription_started_at' => $establishment->created_at ?? now(),
                'plan_id' => $activePlan->id, // Único plano ativo (PLANO PRO)
            ]);

            $this->info("Fixed trial for establishment: {$establishment->name} (ID: {$establishment->id})");
        }

        $this->info('All trial periods have been fixed!');
    }
}