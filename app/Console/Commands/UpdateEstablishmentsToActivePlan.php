<?php

namespace App\Console\Commands;

use App\Models\Establishment;
use App\Models\Plan;
use Illuminate\Console\Command;

class UpdateEstablishmentsToActivePlan extends Command
{
    protected $signature = 'update:establishments-active-plan';
    protected $description = 'Update all establishments to use the active plan (PLANO PRO)';

    public function handle()
    {
        $activePlan = Plan::where('is_active', true)->first();
        
        if (!$activePlan) {
            $this->error('No active plan found in the system.');
            return;
        }

        $this->info("Active Plan: {$activePlan->name} (ID: {$activePlan->id})");

        $establishments = Establishment::where('plan_id', '!=', $activePlan->id)->get();

        if ($establishments->isEmpty()) {
            $this->info('All establishments are already using the active plan.');
            return;
        }

        $this->info("Found {$establishments->count()} establishments to update.");

        foreach ($establishments as $establishment) {
            $oldPlanId = $establishment->plan_id;
            $establishment->update([
                'plan_id' => $activePlan->id,
            ]);

            $this->info("Updated establishment: {$establishment->name} (ID: {$establishment->id}) from plan {$oldPlanId} to {$activePlan->id}");
        }

        $this->info('All establishments updated to active plan!');
    }
}