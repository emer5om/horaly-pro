<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestMercadoPagoBooking extends Command
{
    protected $signature = 'mercadopago:test-booking';
    protected $description = 'Test booking PIX payment creation directly';

    public function handle()
    {
        $this->info('Testing Booking PIX Payment Creation...');
        
        $establishment = \App\Models\Establishment::find(3);
        if (!$establishment) {
            $this->error('Establishment not found');
            return;
        }
        
        $accessToken = $establishment->mercadopago_access_token;
        
        if (!$accessToken) {
            $this->error('Access token not found for establishment');
            return;
        }
        
        $this->info("Using token: " . substr($accessToken, 0, 30) . "...");
        
        // Test data that matches our booking request
        $requestData = [
            'transaction_amount' => 3.0,
            'description' => 'Taxa de agendamento - Preenchimento Labial',
            'payment_method_id' => 'pix',
            'payer' => [
                'email' => 'emersonaraujo5f@gmail.com',
                'first_name' => 'Seu',
                'last_name' => 'Cliente'
            ],
            'metadata' => [
                'appointment_id' => 142,
                'establishment_id' => 3,
                'transaction_id' => 50
            ],
            // 'date_of_expiration' => now()->addMinutes(30)->format('Y-m-d\TH:i:s-03:00'), // Removing optional field
            'external_reference' => 'booking_142_test'
        ];
        
        $this->info('Request data:');
        $this->info(json_encode($requestData, JSON_PRETTY_PRINT));
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
                'X-Idempotency-Key' => uniqid(),
            ])->post('https://api.mercadopago.com/v1/payments', $requestData);
            
            $this->info("HTTP Status: " . $response->status());
            $this->info("Response Headers:");
            foreach ($response->headers() as $key => $value) {
                $this->info("  {$key}: " . (is_array($value) ? implode(', ', $value) : $value));
            }
            $this->info("Response Body:");
            $this->info($response->body());
            
            if ($response->successful()) {
                $data = $response->json();
                $this->info("✅ Success! Payment ID: " . ($data['id'] ?? 'unknown'));
                $this->info("   Status: " . ($data['status'] ?? 'unknown'));
            } else {
                $this->error("❌ HTTP Error: " . $response->status());
                $responseData = $response->json();
                if (isset($responseData['message'])) {
                    $this->error("Message: " . $responseData['message']);
                }
                if (isset($responseData['cause'])) {
                    $this->error("Cause: " . json_encode($responseData['cause'], JSON_PRETTY_PRINT));
                }
                if (isset($responseData['details'])) {
                    $this->error("Details: " . json_encode($responseData['details'], JSON_PRETTY_PRINT));
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ HTTP Exception: " . $e->getMessage());
        }
        
        return 0;
    }
}