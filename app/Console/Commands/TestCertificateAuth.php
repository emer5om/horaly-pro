<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestCertificateAuth extends Command
{
    protected $signature = 'efipay:test-certificate';
    protected $description = 'Test direct certificate authentication with Efí Pay API';

    public function handle()
    {
        $this->info("Testing Efí Pay certificate authentication...");
        
        // Test direct HTTP call with certificate authentication (like our fallback method)
        $this->testDirectCertificateAuth();
    }
    
    private function testDirectCertificateAuth()
    {
        $this->info("\n=== Testing Direct Certificate Authentication ===");
        
        $isProduction = config('efipay.environment') === 'production';
        
        // Use a simple API endpoint to test authentication
        $url = $isProduction 
            ? "https://api.efipay.com.br/v1/plans"
            : "https://sandbox.efipay.com.br/v1/plans";
        
        $certificatePath = $isProduction 
            ? config('efipay.certificate_path_prod')
            : config('efipay.certificate_path');
            
        // Ensure absolute path
        if (!str_starts_with($certificatePath, '/')) {
            $certificatePath = base_path($certificatePath);
        }
        
        $this->info("Environment: " . config('efipay.environment'));
        $this->info("URL: {$url}");
        $this->info("Certificate: {$certificatePath}");
        $this->info("Certificate exists: " . (file_exists($certificatePath) ? 'Yes' : 'No'));
        
        if (!file_exists($certificatePath)) {
            $this->error("Certificate file not found: {$certificatePath}");
            return;
        }
        
        $credentials = base64_encode(config('efipay.client_id') . ':' . config('efipay.client_secret'));
        
        $this->info("Client ID: " . config('efipay.client_id'));
        $this->info("Using Basic Auth: " . substr($credentials, 0, 20) . "...");
        
        $verboseOutput = fopen('php://temp', 'w+');
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Basic ' . $credentials,
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            // For now, test without client certificate
            // CURLOPT_SSLCERT => $certificatePath,
            // CURLOPT_SSLKEY => $certificatePath,
            CURLOPT_SSL_VERIFYPEER => true, // Enable SSL verification
            CURLOPT_SSL_VERIFYHOST => 2, // Enable hostname verification
            CURLOPT_TIMEOUT => 30,
            CURLOPT_VERBOSE => true,
            CURLOPT_STDERR => $verboseOutput,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        
        // Get verbose output
        rewind($verboseOutput);
        $verboseLog = stream_get_contents($verboseOutput);
        fclose($verboseOutput);
        
        curl_close($ch);
        
        $this->info("\n=== Results ===");
        $this->info("HTTP Code: {$httpCode}");
        $this->info("cURL Error: " . ($curlError ?: 'None'));
        
        if ($response) {
            $this->info("Response length: " . strlen($response) . " bytes");
            
            // Try to decode JSON
            $decodedResponse = json_decode($response, true);
            if ($decodedResponse) {
                $this->info("JSON Response (first 500 chars):");
                $this->line(substr(json_encode($decodedResponse, JSON_PRETTY_PRINT), 0, 500));
            } else {
                $this->info("Raw Response (first 500 chars):");
                $this->line(substr($response, 0, 500));
            }
        } else {
            $this->error("No response received");
        }
        
        if ($verboseLog) {
            $this->info("\nVerbose cURL Log:");
            $this->line($verboseLog);
        }
        
        // Determine success
        if ($httpCode >= 200 && $httpCode < 300) {
            $this->info("✅ Certificate authentication SUCCESSFUL");
        } else if ($httpCode >= 400 && $httpCode < 500) {
            $this->warn("⚠️  Authentication issue (4xx error)");
        } else if ($httpCode >= 500) {
            $this->warn("⚠️  Server error (5xx error)");
        } else {
            $this->error("❌ Certificate authentication FAILED");
        }
        
        // Log the test results
        Log::info('Certificate Authentication Test', [
            'http_code' => $httpCode,
            'curl_error' => $curlError,
            'response_length' => $response ? strlen($response) : 0,
            'certificate_path' => $certificatePath,
            'environment' => config('efipay.environment'),
        ]);
    }
}