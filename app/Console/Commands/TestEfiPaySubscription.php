<?php

namespace App\Console\Commands;

use App\Models\Establishment;
use App\Models\Plan;
use App\Services\EfiPayService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestEfiPaySubscription extends Command
{
    protected $signature = 'efipay:test-subscription {establishment_id} {plan_name}';
    protected $description = 'Test Efí Pay subscription creation and payment with certificate authentication';

    public function handle(EfiPayService $efiPayService)
    {
        $establishmentId = $this->argument('establishment_id');
        $planName = $this->argument('plan_name');
        
        $establishment = Establishment::find($establishmentId);
        if (!$establishment) {
            $this->error("Establishment with ID {$establishmentId} not found");
            return 1;
        }

        $plan = Plan::where('name', $planName)->first();
        if (!$plan) {
            $this->error("Plan with name '{$planName}' not found");
            return 1;
        }

        $this->info("Testing Efí Pay subscription for:");
        $this->info("- Establishment: {$establishment->name} (ID: {$establishment->id})");
        $this->info("- Plan: {$plan->name} (Price: R$ {$plan->price})");
        $this->info("- Environment: " . config('efipay.environment'));
        $this->info("- Sandbox: " . (config('efipay.sandbox') ? 'Yes' : 'No'));
        
        try {
            // 1. Get plan ID from Efí Pay
            $this->info("\n1. Getting Efí Pay plan ID...");
            $planSlug = strtolower($plan->name);
            $efiPlanId = $efiPayService->getExistingPlanId($planSlug);
            
            if (!$efiPlanId) {
                $this->error("Plan ID not found for '{$planSlug}'. Available plans:");
                $existingPlans = config('efipay.existing_plans');
                foreach ($existingPlans as $slug => $planData) {
                    $this->line("  - {$slug}: {$planData['efipay_plan_id']}");
                }
                return 1;
            }
            
            $this->info("✓ Plan ID: {$efiPlanId}");

            // 2. Create subscription
            $this->info("\n2. Creating subscription...");
            $subscriptionData = [
                'efipay_plan_id' => $efiPlanId,
                'plan_name' => $plan->name,
                'plan_value' => $plan->price * 100, // convert to cents
                'establishment_id' => $establishment->id,
                // Para sandbox
                'customer_name' => $establishment->user->name,
                'customer_email' => $establishment->user->email,
                // Para produção
                'customer_data' => [
                    'cpf' => '00000000000',
                    'birth' => '1990-01-01',
                    'phone_number' => '11999999999',
                ],
            ];

            $subscriptionResponse = $efiPayService->createSubscription($subscriptionData);
            // A resposta agora está aninhada: data.data.subscription_id
            $responseData = $subscriptionResponse['data']['data'] ?? $subscriptionResponse['data'];
            $subscriptionId = $responseData['subscription_id'];
            $chargeId = $responseData['charges'][0]['charge_id'];
            
            $this->info("✓ Subscription created: {$subscriptionId}");

            // 3. Generate payment token (for testing)
            $this->info("\n3. Generating payment token...");
            $tokenResponse = $efiPayService->getPaymentToken([
                'brand' => 'visa',
                'number' => '4012001038443335', // Test card that should be approved
                'cvv' => '123',
                'expiration_month' => '12',
                'expiration_year' => '2025',
            ]);

            $paymentToken = $tokenResponse['data']['payment_token'];
            $this->info("✓ Payment token generated: " . substr($paymentToken, 0, 10) . "...");

            // 4. Process first payment using certificate authentication
            $this->info("\n4. Processing first payment with certificate authentication...");
            $paymentData = [
                'subscription_id' => $subscriptionId,
                'charge_id' => $chargeId,
                'payment_token' => $paymentToken,
                'customer' => [
                    'name' => $establishment->user->name,
                    'email' => $establishment->user->email,
                    'cpf' => '00000000000',
                    'birth' => '1990-01-01',
                    'phone_number' => '11999999999',
                ],
            ];

            $paymentResponse = $efiPayService->processFirstPayment($paymentData);
            
            $this->info("✓ Payment processed successfully!");
            $this->info("Payment Response:");
            $this->line(json_encode($paymentResponse, JSON_PRETTY_PRINT));

            // 5. Verify final status
            $this->info("\n5. Final status verification:");
            $status = $paymentResponse['data']['status'] ?? 'unknown';
            $this->info("Status: {$status}");
            
            if (in_array($status, ['approved', 'active', 'waiting'])) {
                $this->info("✅ Test PASSED - Payment processed successfully with certificate authentication");
            } else {
                $this->warn("⚠️  Test PARTIAL - Payment processed but status is: {$status}");
            }

        } catch (\Exception $e) {
            $this->error("❌ Test FAILED - Error: " . $e->getMessage());
            $this->error("Check logs for more details: tail -f storage/logs/laravel.log");
            return 1;
        }

        return 0;
    }
}