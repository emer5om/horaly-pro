<?php

namespace App\Services;

use App\Models\Establishment;
use Illuminate\Support\Facades\Log;

class WhatsAppMockService
{
    /**
     * Create a mock WhatsApp instance for development
     */
    public function createInstance(Establishment $establishment): array
    {
        $instanceName = 'mock_horaly_' . $establishment->id . '_' . time();
        
        $establishment->update([
            'whatsapp_instance_name' => $instanceName,
            'whatsapp_instance_id' => $instanceName,
            'whatsapp_status' => 'disconnected',
        ]);

        Log::info('Mock WhatsApp instance created', [
            'establishment_id' => $establishment->id,
            'instance_name' => $instanceName,
        ]);

        return [
            'instance' => [
                'instanceName' => $instanceName,
            ],
        ];
    }

    /**
     * Mock connect instance (generate fake QR code)
     */
    public function connectInstance(Establishment $establishment): array
    {
        if (!$establishment->whatsapp_instance_id) {
            $this->createInstance($establishment);
        }

        // Generate a real-looking QR code for testing
        $qrCodeData = 'https://web.whatsapp.com/qr/mock-' . $establishment->id . '-' . time();
        $fakeQrCode = 'data:image/svg+xml;base64,' . base64_encode('
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="white"/>
                <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">
                    MOCK QR CODE
                </text>
                <text x="100" y="120" text-anchor="middle" font-family="monospace" font-size="8" fill="gray">
                    Development Mode
                </text>
                <text x="100" y="140" text-anchor="middle" font-family="monospace" font-size="8" fill="gray">
                    Click "Simulate Connection"
                </text>
            </svg>
        ');
        
        Log::info('Mock WhatsApp QR code generated', [
            'establishment_id' => $establishment->id,
            'instance_id' => $establishment->whatsapp_instance_id,
        ]);

        return [
            'qr_code' => $fakeQrCode,
            'state' => 'connecting',
            'connected' => false,
            'raw_data' => [
                'mock' => true,
                'message' => 'This is a mock QR code for development. Use the simulate connection button.',
            ],
        ];
    }

    /**
     * Mock instance status check
     */
    public function getInstanceStatus(Establishment $establishment): array
    {
        if (!$establishment->whatsapp_instance_id) {
            Log::info('Mock getInstanceStatus: No instance ID', [
                'establishment_id' => $establishment->id,
            ]);
            return [
                'connected' => false,
                'status' => 'disconnected',
                'qr_code' => null,
            ];
        }

        // Refresh establishment data from database to get latest status
        $establishment->refresh();
        $connected = $establishment->whatsapp_status === 'connected';
        
        Log::info('Mock getInstanceStatus called', [
            'establishment_id' => $establishment->id,
            'instance_id' => $establishment->whatsapp_instance_id,
            'db_whatsapp_status' => $establishment->whatsapp_status,
            'will_return_connected' => $connected,
            'request_timestamp' => now()->toDateTimeString(),
        ]);
        
        // Mock should maintain consistent state - once connected, stay connected
        // unless explicitly disconnected
        $result = [
            'connected' => $connected,
            'status' => $connected ? 'open' : 'close',
            'qr_code' => null,
            'raw_data' => [
                'mock' => true,
                'mock_maintains_state' => true,
                'instance' => [
                    'state' => $connected ? 'open' : 'close',
                ],
                'timestamp' => now()->toDateTimeString(),
            ],
        ];
        
        Log::info('Mock getInstanceStatus returning', [
            'establishment_id' => $establishment->id,
            'result' => $result,
        ]);
        
        return $result;
    }

    /**
     * Mock send message
     */
    public function sendMessage(Establishment $establishment, string $phone, string $message): array
    {
        Log::info('Mock WhatsApp message sent', [
            'establishment_id' => $establishment->id,
            'phone' => $phone,
            'message_preview' => substr($message, 0, 50) . '...',
        ]);

        return [
            'success' => true,
            'message_id' => 'mock_' . time(),
            'mock' => true,
        ];
    }

    /**
     * Mock disconnect instance
     */
    public function disconnectInstance(Establishment $establishment): bool
    {
        // Log stack trace to see where disconnect is being called from
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10);
        $caller = $trace[1] ?? ['file' => 'unknown', 'line' => 'unknown', 'function' => 'unknown'];
        
        Log::warning('Mock WhatsApp instance DISCONNECT called', [
            'establishment_id' => $establishment->id,
            'instance_id' => $establishment->whatsapp_instance_id,
            'called_from' => [
                'file' => $caller['file'] ?? 'unknown',
                'line' => $caller['line'] ?? 'unknown',
                'function' => $caller['function'] ?? 'unknown',
            ],
            'full_trace' => array_slice($trace, 0, 5), // First 5 calls in stack
        ]);

        $establishment->update([
            'whatsapp_status' => 'disconnected',
        ]);

        Log::info('Mock WhatsApp instance disconnected', [
            'establishment_id' => $establishment->id,
            'instance_id' => $establishment->whatsapp_instance_id,
        ]);

        return true;
    }

    /**
     * Simulate connection (for development testing)
     */
    public function simulateConnection(Establishment $establishment): bool
    {
        $establishment->update([
            'whatsapp_status' => 'connected',
        ]);

        Log::info('Mock WhatsApp connection simulated', [
            'establishment_id' => $establishment->id,
            'instance_id' => $establishment->whatsapp_instance_id,
        ]);

        return true;
    }
}
