<?php

namespace App\Console\Commands;

use App\Models\Plan;
use Illuminate\Console\Command;

class CheckPlans extends Command
{
    protected $signature = 'check:plans';
    protected $description = 'Check available plans in the system';

    public function handle()
    {
        $plans = Plan::all();
        
        $this->info("Available Plans:");
        $this->table(
            ['ID', 'Name', 'Price', 'Active'],
            $plans->map(function($plan) {
                return [
                    $plan->id,
                    $plan->name,
                    'R$ ' . number_format($plan->price, 2, ',', '.'),
                    $plan->is_active ? 'YES' : 'NO'
                ];
            })->toArray()
        );
        
        $activePlans = $plans->where('is_active', true);
        $this->info("\nActive Plans Count: " . $activePlans->count());
        
        if ($activePlans->count() === 1) {
            $activePlan = $activePlans->first();
            $this->info("Single Active Plan: {$activePlan->name} (ID: {$activePlan->id})");
        }
    }
}