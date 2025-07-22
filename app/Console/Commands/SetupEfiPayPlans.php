<?php

namespace App\Console\Commands;

use App\Services\EfiPayService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SetupEfiPayPlans extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'efipay:setup-plans {--list : List existing plans} {--create : Create missing plans}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List existing plans or create missing plans in EfiPay';

    private EfiPayService $efiPayService;

    public function __construct(EfiPayService $efiPayService)
    {
        parent::__construct();
        $this->efiPayService = $efiPayService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 EfiPay Plans Setup');
        $this->info('Environment: ' . config('efipay.environment'));
        $this->info('Sandbox: ' . (config('efipay.sandbox') ? 'Yes' : 'No'));
        $this->newLine();

        if ($this->option('list')) {
            $this->listExistingPlans();
        } elseif ($this->option('create')) {
            $this->createMissingPlans();
        } else {
            $this->info('Use one of the following options:');
            $this->info('  --list   : List all existing plans in EfiPay');
            $this->info('  --create : Create missing plans in EfiPay');
            $this->newLine();
            $this->info('Examples:');
            $this->info('  php artisan efipay:setup-plans --list');
            $this->info('  php artisan efipay:setup-plans --create');
        }
    }

    private function listExistingPlans()
    {
        try {
            $this->info('📋 Listing existing plans in EfiPay...');
            $this->newLine();

            $plans = $this->efiPayService->listPlans();
            
            if (empty($plans['data'])) {
                $this->warn('❌ No plans found in EfiPay');
                $this->newLine();
                $this->info('💡 Run with --create to create the required plans');
                return;
            }

            $this->info('✅ Found ' . count($plans['data']) . ' plans:');
            $this->newLine();

            $table = [];
            foreach ($plans['data'] as $plan) {
                $table[] = [
                    'ID' => $plan['plan_id'] ?? 'N/A',
                    'Name' => $plan['name'] ?? 'N/A',
                    'Status' => $plan['status'] ?? 'N/A',
                    'Interval' => ($plan['interval'] ?? 'N/A') . ' month(s)',
                    'Created' => isset($plan['created_at']) ? date('Y-m-d H:i:s', strtotime($plan['created_at'])) : 'N/A',
                ];
            }

            $this->table(['ID', 'Name', 'Status', 'Interval', 'Created'], $table);

            $this->newLine();
            $this->info('💡 Copy the Plan IDs and add them to your .env file:');
            $this->info('EFIPAY_PLAN_STARTER_ID=<plan_id_here>');
            $this->info('EFIPAY_PLAN_PROFESSIONAL_ID=<plan_id_here>');
            $this->info('EFIPAY_PLAN_ENTERPRISE_ID=<plan_id_here>');

        } catch (\Exception $e) {
            $this->error('❌ Error listing plans: ' . $e->getMessage());
            Log::error('EfiPay List Plans Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    private function createMissingPlans()
    {
        try {
            $this->info('🚀 Creating required plans in EfiPay...');
            $this->newLine();

            $requiredPlans = [
                'starter' => [
                    'name' => 'Horaly Starter Plan',
                    'repeats' => 12,
                    'interval' => 1,
                ],
                'professional' => [
                    'name' => 'Horaly Professional Plan',
                    'repeats' => 12,
                    'interval' => 1,
                ],
                'enterprise' => [
                    'name' => 'Horaly Enterprise Plan',
                    'repeats' => 12,
                    'interval' => 1,
                ],
            ];

            $createdPlans = [];

            foreach ($requiredPlans as $key => $planData) {
                try {
                    $this->info("Creating {$planData['name']}...");
                    
                    $response = $this->efiPayService->createPlan($planData);
                    
                    if (isset($response['data']['plan_id'])) {
                        $planId = $response['data']['plan_id'];
                        $createdPlans[$key] = $planId;
                        
                        $this->info("✅ Created: {$planData['name']} (ID: {$planId})");
                    } else {
                        $this->error("❌ Failed to create: {$planData['name']}");
                    }
                    
                } catch (\Exception $e) {
                    $this->error("❌ Error creating {$planData['name']}: " . $e->getMessage());
                }
            }

            if (!empty($createdPlans)) {
                $this->newLine();
                $this->info('🎉 Plans created successfully!');
                $this->newLine();
                $this->info('📝 Add these to your .env file:');
                
                $envMappings = [
                    'starter' => 'EFIPAY_PLAN_STARTER_ID',
                    'professional' => 'EFIPAY_PLAN_PROFESSIONAL_ID',
                    'enterprise' => 'EFIPAY_PLAN_ENTERPRISE_ID',
                ];

                foreach ($createdPlans as $key => $planId) {
                    $envKey = $envMappings[$key];
                    $this->info("{$envKey}={$planId}");
                }
            } else {
                $this->warn('⚠️  No plans were created successfully');
            }

        } catch (\Exception $e) {
            $this->error('❌ Error creating plans: ' . $e->getMessage());
            Log::error('EfiPay Create Plans Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
