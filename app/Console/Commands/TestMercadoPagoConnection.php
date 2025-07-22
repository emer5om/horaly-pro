<?php

namespace App\Console\Commands;

use App\Services\MercadoPagoService;
use Illuminate\Console\Command;
use MercadoPago\Client\Common\RequestOptions;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\MercadoPagoConfig;
use Illuminate\Support\Facades\Http;

class TestMercadoPagoConnection extends Command
{
    protected $signature = 'mercadopago:test-connection';
    protected $description = 'Test MercadoPago API connection and credentials';

    public function handle()
    {
        $this->info('Testing MercadoPago Connection...');
        
        // Test with direct HTTP first
        $this->info("\n=== Testing with Direct HTTP ===");
        $this->testDirectHttp();
        
        // Test system credentials
        $this->info("\n=== Testing System Credentials ===");
        $this->testSystemCredentials();
        
        // Test establishment credentials (if any)
        $this->info("\n=== Testing Establishment Credentials ===");
        $this->testEstablishmentCredentials();
        
        return 0;
    }
    
    private function testDirectHttp()
    {
        $accessToken = config('mercadopago.access_token');
        
        if (!$accessToken) {
            $this->error('❌ Access token not configured');
            return;
        }
        
        $this->info("Testing direct HTTP request to MercadoPago API...");
        
        $requestData = [
            'transaction_amount' => 1.00,
            'description' => 'Test PIX payment via HTTP',
            'payment_method_id' => 'pix',
            'payer' => [
                'email' => 'test@test.com',
                'first_name' => 'Test',
                'last_name' => 'User',
                'identification' => [
                    'type' => 'CPF',
                    'number' => '12345678909'
                ]
            ]
        ];
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
                'X-Idempotency-Key' => uniqid(),
            ])->post('https://api.mercadopago.com/v1/payments', $requestData);
            
            $this->info("HTTP Status: " . $response->status());
            $this->info("Response: " . $response->body());
            
            if ($response->successful()) {
                $data = $response->json();
                $this->info("✅ Success! Payment ID: " . ($data['id'] ?? 'unknown'));
            } else {
                $this->error("❌ HTTP Error: " . $response->status());
                $responseData = $response->json();
                if (isset($responseData['message'])) {
                    $this->error("Message: " . $responseData['message']);
                }
                if (isset($responseData['cause'])) {
                    $this->error("Cause: " . json_encode($responseData['cause'], JSON_PRETTY_PRINT));
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ HTTP Exception: " . $e->getMessage());
        }
    }
    
    private function testSystemCredentials()
    {
        $accessToken = config('mercadopago.access_token');
        $environment = config('mercadopago.environment');
        
        $this->info("Environment: {$environment}");
        $this->info("Access Token: " . ($accessToken ? substr($accessToken, 0, 20) . '...' : 'NOT SET'));
        
        if (!$accessToken) {
            $this->error('❌ Access token not configured in .env');
            return;
        }
        
        try {
            // Configure MercadoPago
            MercadoPagoConfig::setAccessToken($accessToken);
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
            
            // Try to create a simple request to test credentials
            $client = new PaymentClient();
            
            // Test with minimal PIX payment data
            $request = [
                'transaction_amount' => 1.00,
                'description' => 'Test PIX payment',
                'payment_method_id' => 'pix',
                'payer' => [
                    'email' => 'test@test.com',
                    'first_name' => 'Test',
                    'last_name' => 'User',
                    'identification' => [
                        'type' => 'CPF',
                        'number' => '12345678909'
                    ]
                ]
            ];
            
            $this->info('Attempting to create test PIX payment...');
            $payment = $client->create($request);
            
            $this->info("✅ Success! Payment created with ID: {$payment->id}");
            $this->info("   Status: {$payment->status}");
            
            if (isset($payment->point_of_interaction->transaction_data->qr_code)) {
                $this->info("   QR Code generated successfully");
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Failed: " . $e->getMessage());
            $this->info("Error code: " . $e->getCode());
            $this->info("Error type: " . get_class($e));
            
            // Try different methods to get error details
            if (method_exists($e, 'getApiResponse')) {
                $response = $e->getApiResponse();
                if ($response) {
                    $this->error("API Response: " . json_encode($response, JSON_PRETTY_PRINT));
                }
            }
            
            if (method_exists($e, 'getMessage')) {
                $this->info("Full message: " . $e->getMessage());
            }
            
            if (method_exists($e, 'getFile')) {
                $this->info("File: " . $e->getFile() . ':' . $e->getLine());
            }
            
            // Check if it's a specific MercadoPago exception
            if ($e instanceof \MercadoPago\Exceptions\MPApiException) {
                $this->error("This is an MPApiException");
                if (method_exists($e, 'getApiResponse')) {
                    $apiResponse = $e->getApiResponse();
                    $this->error("API Response: " . json_encode($apiResponse, JSON_PRETTY_PRINT));
                }
            }
        }
    }
    
    private function testEstablishmentCredentials()
    {
        $establishment = \App\Models\Establishment::whereNotNull('mercadopago_access_token')->first();
        
        if (!$establishment) {
            $this->warn('No establishments with MercadoPago configured found');
            return;
        }
        
        $this->info("Testing establishment: {$establishment->name}");
        $this->info("Token: " . substr($establishment->mercadopago_access_token, 0, 20) . '...');
        
        try {
            $service = MercadoPagoService::forEstablishment($establishment);
            
            if (!$service) {
                $this->error('❌ Could not create service for establishment');
                return;
            }
            
            // Test payment creation
            $paymentData = [
                'amount' => 5.00,
                'description' => 'Test booking fee',
                'appointment_id' => 999,
                'transaction_id' => 999,
                'payer' => [
                    'email' => 'customer@test.com',
                    'first_name' => 'Test',
                    'last_name' => 'Customer',
                    'cpf' => '12345678909'
                ]
            ];
            
            $this->info('Testing booking PIX payment creation...');
            $result = $service->createBookingPixPayment($paymentData);
            
            if ($result['success']) {
                $this->info("✅ Success! Payment ID: {$result['payment_id']}");
                $this->info("   Status: {$result['status']}");
            } else {
                $this->error("❌ Failed: {$result['error']}");
                if (isset($result['error_details'])) {
                    $this->error("Details: {$result['error_details']}");
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Exception: " . $e->getMessage());
        }
    }
}