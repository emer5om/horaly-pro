<?php

namespace App\Services;

use App\Models\Establishment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsAppService
{
    private string $baseUrl;
    private string $apiKey;
    private bool $useMock;
    private WhatsAppMockService $mockService;

    public function __construct()
    {
        $this->baseUrl = config('services.evolution.url');
        $this->apiKey = config('services.evolution.api_key');
        
        // Use mock if no Evolution API configured
        $this->useMock = empty($this->baseUrl) || empty($this->apiKey);
        
        if ($this->useMock) {
            $this->mockService = new WhatsAppMockService();
            Log::info('WhatsApp Service initialized in MOCK mode');
        } else {
            Log::debug('WhatsApp Service initialized in REAL mode', [
                'base_url' => $this->baseUrl,
                'has_api_key' => !empty($this->apiKey),
            ]);
        }
    }

    /**
     * Create a new WhatsApp instance for an establishment
     */
    public function createInstance(Establishment $establishment): array
    {
        if ($this->useMock) {
            return $this->mockService->createInstance($establishment);
        }
        $instanceName = $this->generateInstanceName($establishment);
        
        $payload = [
            'instanceName' => $instanceName,
            'integration' => 'WHATSAPP-BAILEYS',
            'qrcode' => true, // This is the key! Forces QR code generation
            'rejectCall' => false,
            'msgCall' => 'Sistema de agendamento não recebe ligações.',
            'groupsIgnore' => true,
            'alwaysOnline' => true,
            'readMessages' => false,
            'readStatus' => false,
            'syncFullHistory' => false,
            'webhook' => [
                'url' => config('services.evolution.webhook_url'),
                'byEvents' => true,
                'base64' => false,
                'events' => [
                    'APPLICATION_STARTUP',
                    'QRCODE_UPDATED',
                    'CONNECTION_UPDATE',
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'SEND_MESSAGE',
                ],
            ],
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'apikey' => $this->apiKey,
            ])->post("{$this->baseUrl}/instance/create", $payload);

            if ($response->successful()) {
                $data = $response->json();
                
                $establishment->update([
                    'whatsapp_instance_name' => $instanceName,
                    'whatsapp_instance_id' => $data['instance']['instanceName'] ?? $instanceName,
                    'whatsapp_status' => 'disconnected',
                    'whatsapp_config' => $data,
                ]);

                return $data;
            }

            throw new \Exception('Failed to create WhatsApp instance: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('WhatsApp instance creation failed', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Connect WhatsApp instance (get QR code)
     */
    public function connectInstance(Establishment $establishment): array
    {
        if ($this->useMock) {
            return $this->mockService->connectInstance($establishment);
        }
        try {
            Log::info('Starting WhatsApp connection process', [
                'establishment_id' => $establishment->id,
                'existing_instance_id' => $establishment->whatsapp_instance_id,
            ]);

            // Check if instance already exists and is connected
            if ($establishment->whatsapp_instance_id) {
                Log::info('Instance exists, checking status first', [
                    'establishment_id' => $establishment->id,
                    'instance_id' => $establishment->whatsapp_instance_id,
                ]);
                
                $currentStatus = $this->getInstanceStatus($establishment);
                if ($currentStatus['connected']) {
                    Log::info('Instance already connected', [
                        'establishment_id' => $establishment->id,
                        'instance_id' => $establishment->whatsapp_instance_id,
                    ]);
                    return [
                        'qr_code' => null,
                        'state' => 'open',
                        'connected' => true,
                        'raw_data' => $currentStatus,
                    ];
                }
                
                // If not connected, delete and recreate
                Log::info('Instance exists but not connected, recreating', [
                    'establishment_id' => $establishment->id,
                    'instance_id' => $establishment->whatsapp_instance_id,
                ]);
                
                $this->deleteInstance($establishment);
                sleep(3); // Give time for cleanup
            }
            
            // Create a fresh instance
            Log::info('Creating new WhatsApp instance', [
                'establishment_id' => $establishment->id,
            ]);
            
            $this->createInstance($establishment);
            sleep(3); // Reduced wait time
            
            // Get QR code from the instance
            Log::info('Getting QR code from instance', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
            ]);
            
            $connectResponse = Http::withHeaders([
                'apikey' => $this->apiKey,
            ])->get("{$this->baseUrl}/instance/connect/{$establishment->whatsapp_instance_id}");

            Log::info('WhatsApp Connect API Call', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
                'url' => "{$this->baseUrl}/instance/connect/{$establishment->whatsapp_instance_id}",
                'success' => $connectResponse->successful(),
                'status' => $connectResponse->status(),
                'response_body' => $connectResponse->body(),
            ]);

            if ($connectResponse->successful()) {
                $connectData = $connectResponse->json();
                
                // Extract QR code from connect response - use base64 image for display
                $qrCode = $connectData['base64'] ?? 
                         $connectData['qrcode'] ?? 
                         $connectData['code'] ?? 
                         null;
                
                // Also get the current state
                $stateResponse = Http::withHeaders([
                    'apikey' => $this->apiKey,
                ])->get("{$this->baseUrl}/instance/connectionState/{$establishment->whatsapp_instance_id}");
                
                $state = 'connecting';
                $lastData = $connectData;
                
                if ($stateResponse->successful()) {
                    $stateData = $stateResponse->json();
                    $state = $stateData['instance']['state'] ?? 'connecting';
                    $lastData = array_merge($connectData, $stateData);
                }
                
                Log::info('WhatsApp QR Code Retrieved', [
                    'establishment_id' => $establishment->id,
                    'has_qr_code' => !empty($qrCode),
                    'qr_code_length' => $qrCode ? strlen($qrCode) : 0,
                    'state' => $state,
                    'connect_response' => $connectData,
                ]);
            } else {
                throw new \Exception('Failed to get QR code from connect endpoint: ' . $connectResponse->body());
            }
            
            $finalState = $state ?? 'connecting';
            $establishment->update(['whatsapp_status' => $finalState === 'open' ? 'connected' : 'connecting']);
            
            // Return the data with QR code if available
            return [
                'qr_code' => $qrCode,
                'state' => $finalState,
                'connected' => $finalState === 'open',
                'raw_data' => $lastData,
            ];

        } catch (\Exception $e) {
            Log::error('WhatsApp connection failed', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Get instance status and QR code
     */
    public function getInstanceStatus(Establishment $establishment): array
    {
        if ($this->useMock) {
            return $this->mockService->getInstanceStatus($establishment);
        }
        if (!$establishment->whatsapp_instance_id) {
            Log::info('No instance ID found for establishment', [
                'establishment_id' => $establishment->id,
            ]);
            return [
                'connected' => false,
                'status' => 'disconnected',
                'qr_code' => null,
            ];
        }

        try {
            Log::debug('Checking WhatsApp instance status', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
            ]);
            
            $response = Http::withHeaders([
                'apikey' => $this->apiKey,
            ])->get("{$this->baseUrl}/instance/connectionState/{$establishment->whatsapp_instance_id}");

            Log::debug('Status API response', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
                'success' => $response->successful(),
                'status_code' => $response->status(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $state = $data['instance']['state'] ?? 'close';
                
                $connected = $state === 'open';
                
                // Update establishment status in database
                $establishment->update(['whatsapp_status' => $connected ? 'connected' : 'disconnected']);
                
                Log::debug('WhatsApp status updated', [
                    'establishment_id' => $establishment->id,
                    'instance_id' => $establishment->whatsapp_instance_id,
                    'state' => $state,
                    'connected' => $connected,
                ]);
                
                return [
                    'connected' => $connected,
                    'status' => $state,
                    'qr_code' => $data['instance']['qrcode'] ?? null,
                    'raw_data' => $data,
                ];
            }

            throw new \Exception('Failed to get instance status: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Failed to get WhatsApp status', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
                'error' => $e->getMessage(),
            ]);
            
            // Update establishment status to disconnected on error
            $establishment->update(['whatsapp_status' => 'disconnected']);
            
            return [
                'connected' => false,
                'status' => 'error',
                'qr_code' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send a text message
     */
    public function sendMessage(Establishment $establishment, string $phone, string $message): array
    {
        if ($this->useMock) {
            return $this->mockService->sendMessage($establishment, $phone, $message);
        }
        if (!$establishment->whatsapp_instance_id || $establishment->whatsapp_status !== 'connected') {
            // Para teste, vamos simular sucesso se WhatsApp estiver "connected" (mesmo sem instância real)
            if ($establishment->whatsapp_connected) {
                \Log::info('WhatsApp message simulated (no real connection)', [
                    'establishment_id' => $establishment->id,
                    'phone' => $phone,
                    'message_preview' => substr($message, 0, 100) . '...',
                ]);
                return ['success' => true, 'message_id' => 'simulated_' . time()];
            }
            throw new \Exception('WhatsApp instance not connected');
        }

        $payload = [
            'number' => $this->formatPhoneNumber($phone),
            'text' => $message,
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'apikey' => $this->apiKey,
            ])->post("{$this->baseUrl}/message/sendText/{$establishment->whatsapp_instance_id}", $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                
                // Check if the response indicates the number doesn't exist
                if (isset($responseData['response']['message'][0]['exists']) && 
                    $responseData['response']['message'][0]['exists'] === false) {
                    
                    Log::warning('WhatsApp number does not exist', [
                        'establishment_id' => $establishment->id,
                        'phone' => $phone,
                        'response' => $responseData,
                    ]);
                    
                    return [
                        'success' => false,
                        'error' => 'Número não existe no WhatsApp',
                        'response' => $responseData
                    ];
                }
                
                // Message sent successfully
                return [
                    'success' => true,
                    'message_id' => $responseData['key']['id'] ?? 'unknown',
                    'response' => $responseData
                ];
            }

            // HTTP error
            Log::error('WhatsApp API HTTP error', [
                'establishment_id' => $establishment->id,
                'phone' => $phone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            
            return [
                'success' => false,
                'error' => 'Erro na API do WhatsApp: HTTP ' . $response->status(),
                'response' => $response->body()
            ];
            
        } catch (\Exception $e) {
            Log::error('WhatsApp message failed', [
                'establishment_id' => $establishment->id,
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'exception' => $e
            ];
        }
    }

    /**
     * Send appointment notification
     */
    public function sendAppointmentNotification(Establishment $establishment, $appointment, string $type): bool
    {
        if (!$establishment->notifications_enabled || !$establishment->whatsapp_instance_id) {
            return false;
        }

        $message = $this->buildNotificationMessage($establishment, $appointment, $type);
        
        if (!$message) {
            return false;
        }

        try {
            $this->sendMessage($establishment, $appointment->customer_phone, $message);
            return true;
        } catch (\Exception $e) {
            Log::warning('Failed to send appointment notification', [
                'establishment_id' => $establishment->id,
                'appointment_id' => $appointment->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Disconnect WhatsApp instance
     */
    public function disconnectInstance(Establishment $establishment): bool
    {
        // Log stack trace to see where disconnect is being called from
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10);
        $caller = $trace[1] ?? ['file' => 'unknown', 'line' => 'unknown', 'function' => 'unknown'];
        
        Log::warning('WhatsApp disconnect instance CALLED', [
            'establishment_id' => $establishment->id,
            'instance_id' => $establishment->whatsapp_instance_id,
            'using_mock' => $this->useMock,
            'called_from' => [
                'file' => basename($caller['file'] ?? 'unknown'),
                'line' => $caller['line'] ?? 'unknown',
                'function' => $caller['function'] ?? 'unknown',
            ],
            'trace_summary' => array_map(function($item) {
                return [
                    'file' => basename($item['file'] ?? 'unknown'),
                    'line' => $item['line'] ?? 'unknown',
                    'function' => $item['function'] ?? 'unknown',
                ];
            }, array_slice($trace, 0, 5))
        ]);

        if ($this->useMock) {
            return $this->mockService->disconnectInstance($establishment);
        }
        if (!$establishment->whatsapp_instance_id) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'apikey' => $this->apiKey,
            ])->delete("{$this->baseUrl}/instance/logout/{$establishment->whatsapp_instance_id}");

            if ($response->successful()) {
                $establishment->update([
                    'whatsapp_status' => 'disconnected',
                    'whatsapp_disconnected_at' => now(),
                ]);
                
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('WhatsApp disconnect failed', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Delete WhatsApp instance
     */
    public function deleteInstance(Establishment $establishment): bool
    {
        if (!$establishment->whatsapp_instance_id) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'apikey' => $this->apiKey,
            ])->delete("{$this->baseUrl}/instance/delete/{$establishment->whatsapp_instance_id}");

            if ($response->successful()) {
                $establishment->update([
                    'whatsapp_instance_name' => null,
                    'whatsapp_instance_id' => null,
                    'whatsapp_status' => 'disconnected',
                    'whatsapp_config' => null,
                    'whatsapp_connected_at' => null,
                    'whatsapp_disconnected_at' => now(),
                ]);
                
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('WhatsApp instance deletion failed', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Generate unique instance name for establishment
     */
    private function generateInstanceName(Establishment $establishment): string
    {
        return 'horaly_' . $establishment->id . '_' . Str::random(8);
    }

    /**
     * Format phone number for WhatsApp
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/\D/', '', $phone);
        
        // Add Brazil country code if not present
        if (strlen($phone) === 11 && !str_starts_with($phone, '55')) {
            $phone = '55' . $phone;
        } elseif (strlen($phone) === 10 && !str_starts_with($phone, '55')) {
            $phone = '55' . $phone;
        }
        
        return $phone;
    }

    /**
     * Build notification message based on type and establishment templates
     */
    private function buildNotificationMessage(Establishment $establishment, $appointment, string $type): ?string
    {
        $templates = $establishment->notification_templates ?? [];
        
        // Default templates if none configured
        $defaultTemplates = [
            'confirmed' => "Olá {customer_name}! Seu agendamento foi confirmado para {date} às {time}. {establishment_name}.",
            'reminder' => "Lembrete: Você tem um agendamento hoje às {time} em {establishment_name}.",
            'canceled' => "Seu agendamento para {date} às {time} foi cancelado. {establishment_name}.",
            'completed' => "Obrigado por usar nossos serviços! Esperamos vê-lo novamente. {establishment_name}.",
        ];
        
        $template = $templates[$type] ?? $defaultTemplates[$type] ?? null;
        
        if (!$template) {
            return null;
        }
        
        // Replace placeholders
        $replacements = [
            '{customer_name}' => $appointment->customer_name ?? 'Cliente',
            '{date}' => $appointment->date ? \Carbon\Carbon::parse($appointment->date)->format('d/m/Y') : '',
            '{time}' => $appointment->time ?? '',
            '{establishment_name}' => $establishment->name,
            '{service_name}' => $appointment->service_name ?? '',
            '{price}' => $appointment->price ? 'R$ ' . number_format($appointment->price, 2, ',', '.') : '',
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
}