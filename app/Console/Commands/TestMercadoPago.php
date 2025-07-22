<?php

namespace App\Console\Commands;

use App\Models\Establishment;
use App\Models\Plan;
use App\Services\MercadoPagoService;
use Illuminate\Console\Command;

class TestMercadoPago extends Command
{
    protected $signature = 'mercadopago:test {establishment_id} {plan_id}';
    protected $description = 'Test MercadoPago PIX payment creation';

    public function handle(MercadoPagoService $mercadoPagoService)
    {
        $establishmentId = $this->argument('establishment_id');
        $planId = $this->argument('plan_id');
        
        $establishment = Establishment::find($establishmentId);
        if (!$establishment) {
            $this->error("Establishment with ID {$establishmentId} not found");
            return 1;
        }

        $plan = Plan::find($planId);
        if (!$plan) {
            $this->error("Plan with ID {$planId} not found");
            return 1;
        }

        $this->info("Testing MercadoPago PIX payment for:");
        $this->info("- Establishment: {$establishment->name} (ID: {$establishment->id})");
        $this->info("- Plan: {$plan->name} (Price: R$ {$plan->price})");
        $this->info("- Environment: " . config('mercadopago.environment'));
        
        try {
            $paymentData = [
                'amount' => $plan->price,
                'description' => "Plano {$plan->name} - {$establishment->name}",
                'establishment_id' => $establishment->id,
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'payer' => [
                    'email' => $establishment->user->email,
                    'first_name' => explode(' ', $establishment->user->name)[0],
                    'last_name' => implode(' ', array_slice(explode(' ', $establishment->user->name), 1)) ?: 'Silva',
                    'cpf' => '00000000000', // CPF de teste
                ]
            ];

            $this->info("\nCreating PIX payment...");
            $result = $mercadoPagoService->createPixPayment($paymentData);

            if ($result['success']) {
                $this->info("✅ PIX Payment created successfully!");
                $this->info("Payment ID: {$result['payment_id']}");
                $this->info("Status: {$result['status']}");
                $this->info("Amount: R$ {$result['amount']}");
                $this->info("Expires at: {$result['expires_at']}");
                $this->info("External Reference: {$result['external_reference']}");
                
                if ($result['qr_code']) {
                    $this->info("\nQR Code: {$result['qr_code']}");
                }
                
                if ($result['ticket_url']) {
                    $this->info("Ticket URL: {$result['ticket_url']}");
                }
                
                // Test payment status check
                $this->info("\nChecking payment status...");
                $statusResult = $mercadoPagoService->getPaymentStatus($result['payment_id']);
                
                if ($statusResult['success']) {
                    $this->info("✅ Payment status check successful!");
                    $this->info("Status: {$statusResult['status']}");
                    $this->info("Status Detail: {$statusResult['status_detail']}");
                } else {
                    $this->warn("⚠️  Payment status check failed: {$statusResult['error']}");
                }
                
            } else {
                $this->error("❌ PIX Payment creation failed: {$result['error']}");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("❌ Test FAILED - Error: " . $e->getMessage());
            $this->error("Check logs for more details: tail -f storage/logs/laravel.log");
            return 1;
        }

        $this->info("\n🎉 MercadoPago PIX integration test completed successfully!");
        return 0;
    }
}