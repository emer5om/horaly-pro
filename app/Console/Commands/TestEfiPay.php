<?php

namespace App\Console\Commands;

use App\Services\EfiPayService;
use Illuminate\Console\Command;

class TestEfiPay extends Command
{
    protected $signature = 'efipay:test';
    protected $description = 'Test Efí Pay configuration and connection';

    public function handle(EfiPayService $efiPayService)
    {
        $this->info('🔧 Testando configuração do Efí Pay...');
        
        // Test 1: Check configuration
        $this->info('📋 Verificando configuração:');
        $this->line('Environment: ' . config('efipay.environment'));
        $this->line('Sandbox: ' . (config('efipay.sandbox') ? 'SIM' : 'NÃO'));
        $this->line('Client ID: ' . substr(config('efipay.client_id'), 0, 20) . '...');
        $this->line('Certificate: ' . config('efipay.certificate_path'));
        
        // Test 2: Check certificate file
        $certificatePath = base_path(config('efipay.certificate_path'));
        if (file_exists($certificatePath)) {
            $this->info('✅ Certificado encontrado: ' . $certificatePath);
        } else {
            $this->error('❌ Certificado não encontrado: ' . $certificatePath);
            return 1;
        }
        
        // Test 3: Test payment token generation
        $this->info('🎯 Testando geração de token de pagamento...');
        try {
            $testCardData = [
                'brand' => 'visa',
                'number' => '4000000000000010', // Número de teste do Efí Pay
                'cvv' => '123',
                'expiration_month' => '12',
                'expiration_year' => '2025',
            ];
            
            $tokenResponse = $efiPayService->getPaymentToken($testCardData);
            
            if (isset($tokenResponse['data']['payment_token'])) {
                $this->info('✅ Token de pagamento gerado com sucesso!');
                $this->line('Token: ' . substr($tokenResponse['data']['payment_token'], 0, 20) . '...');
                $this->line('Cartão: ' . $tokenResponse['data']['card_mask']);
            } else {
                $this->error('❌ Falha ao gerar token de pagamento');
                $this->line('Resposta: ' . json_encode($tokenResponse));
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('❌ Erro ao gerar token: ' . $e->getMessage());
            return 1;
        }
        
        // Test 4: Test plan creation
        $this->info('📋 Testando criação de plano...');
        try {
            $testPlanData = [
                'name' => 'Teste Plano ' . now()->format('Y-m-d H:i:s'),
                'cycles' => 12,
                'interval' => 1,
            ];
            
            $planResponse = $efiPayService->createPlan($testPlanData);
            
            if (isset($planResponse['plan_id'])) {
                $this->info('✅ Plano criado com sucesso!');
                $this->line('Plan ID: ' . $planResponse['plan_id']);
            } else {
                $this->error('❌ Falha ao criar plano');
                $this->line('Resposta: ' . json_encode($planResponse));
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('❌ Erro ao criar plano: ' . $e->getMessage());
            return 1;
        }
        
        $this->info('🎉 Todos os testes passaram! Efí Pay está configurado corretamente.');
        
        return 0;
    }
}