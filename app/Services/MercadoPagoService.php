<?php

namespace App\Services;

use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\MercadoPagoConfig;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MercadoPagoService
{
    private $accessToken;
    private $publicKey;
    private $establishment;
    
    public function __construct($accessToken = null, $publicKey = null, $establishment = null)
    {
        $this->accessToken = $accessToken ?? config('mercadopago.access_token');
        $this->publicKey = $publicKey ?? config('mercadopago.public_key');
        $this->establishment = $establishment;
        
        // Configure MercadoPago SDK
        MercadoPagoConfig::setAccessToken($this->accessToken);
        
        // Set environment based on token type
        if (str_contains($this->accessToken, 'TEST-')) {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
        } else {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::SERVER);
        }
        
        // Log initialization only in debug mode
        if (config('app.debug')) {
            Log::debug('MercadoPago Service initialized', [
                'access_token_prefix' => substr($this->accessToken, 0, 20) . '...',
                'environment' => str_contains($this->accessToken, 'TEST-') ? 'sandbox' : 'production',
                'establishment_id' => $this->establishment->id ?? 'system'
            ]);
        }
    }
    
    /**
     * Create a new instance configured for a specific establishment
     */
    public static function forEstablishment($establishment)
    {
        if (!$establishment->mercadopago_access_token) {
            return null;
        }
        
        return new self(
            $establishment->mercadopago_access_token,
            $establishment->mercadopago_public_key,
            $establishment
        );
    }
    
    /**
     * Criar pagamento PIX para assinatura de plano
     */
    public function createPixPayment(array $paymentData)
    {
        
        try {
            $client = new PaymentClient();
            
            // Montar dados do pagamento
            $request = [
                'transaction_amount' => (float) $paymentData['amount'],
                'description' => $paymentData['description'],
                'payment_method_id' => 'pix',
                'payer' => [
                    'email' => $paymentData['payer']['email'],
                    'first_name' => $paymentData['payer']['first_name'],
                    'last_name' => $paymentData['payer']['last_name'],
                    'identification' => [
                        'type' => 'CPF',
                        'number' => $paymentData['payer']['cpf']
                    ]
                ],
                'metadata' => [
                    'establishment_id' => $paymentData['establishment_id'],
                    'plan_id' => $paymentData['plan_id'],
                    'plan_name' => $paymentData['plan_name'],
                ],
                // 'date_of_expiration' => Carbon::now()->addMinutes(30)->format('Y-m-d\TH:i:s.v-03:00'), // Optional field causing issues
                'notification_url' => config('mercadopago.webhook_url'),
            ];
            
            // Adicionar external_reference para rastreamento
            $request['external_reference'] = 'establishment_' . $paymentData['establishment_id'] . '_plan_' . $paymentData['plan_id'] . '_' . time();
            
            // Log payment creation only in debug mode
            if (config('app.debug')) {
                Log::debug('MercadoPago PIX Payment Request', [
                    'establishment_id' => $paymentData['establishment_id'],
                    'amount' => $request['transaction_amount']
                ]);
            }
            
            $payment = $client->create($request);
            
            // Log successful payment creation
            Log::info('PIX Payment Created', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'amount' => $payment->transaction_amount,
                'establishment_id' => $paymentData['establishment_id']
            ]);
            
            return [
                'success' => true,
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'qr_code' => $payment->point_of_interaction->transaction_data->qr_code ?? null,
                'qr_code_base64' => $payment->point_of_interaction->transaction_data->qr_code_base64 ?? null,
                'ticket_url' => $payment->point_of_interaction->transaction_data->ticket_url ?? null,
                'external_reference' => $payment->external_reference,
                'expires_at' => $payment->date_of_expiration,
                'amount' => $payment->transaction_amount,
            ];
            
        } catch (\Exception $e) {
            Log::error('MercadoPago PIX Payment Error', [
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'establishment_id' => $paymentData['establishment_id'] ?? null,
                'request_data' => $request ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Try to get more detailed error from MercadoPago
            $errorDetails = 'Erro desconhecido';
            if (method_exists($e, 'getApiResponse')) {
                $apiResponse = $e->getApiResponse();
                if ($apiResponse) {
                    $errorDetails = json_encode($apiResponse);
                    Log::error('MercadoPago API Response Details', ['api_response' => $apiResponse]);
                }
            } else {
                Log::error('Exception details', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);
            }
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_details' => $errorDetails
            ];
        }
    }
    
    /**
     * Consultar status do pagamento
     */
    public function getPaymentStatus($paymentId)
    {
        try {
            $client = new PaymentClient();
            $payment = $client->get($paymentId);
            
            // Only log status changes, not every check
            // Log::debug('MercadoPago Payment Status Check', [
            //     'payment_id' => $paymentId,
            //     'status' => $payment->status,
            //     'status_detail' => $payment->status_detail
            // ]);
            
            return [
                'success' => true,
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'status_detail' => $payment->status_detail,
                'external_reference' => $payment->external_reference,
                'amount' => $payment->transaction_amount,
                'paid_amount' => $payment->transaction_details->net_received_amount ?? 0,
                'created_at' => $payment->date_created,
                'approved_at' => $payment->date_approved,
            ];
            
        } catch (\Exception $e) {
            Log::error('MercadoPago Payment Status Error', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Processar webhook do Mercado Pago
     */
    public function processWebhook(array $webhookData)
    {
        try {
            Log::info('MercadoPago Webhook Received', $webhookData);
            
            $type = $webhookData['type'] ?? null;
            $dataId = $webhookData['data']['id'] ?? null;
            
            if ($type === 'payment' && $dataId) {
                $paymentStatus = $this->getPaymentStatus($dataId);
                
                if ($paymentStatus['success']) {
                    $this->handlePaymentStatusChange($paymentStatus);
                }
                
                return ['status' => 'processed'];
            }
            
            return ['status' => 'ignored'];
            
        } catch (\Exception $e) {
            Log::error('MercadoPago Webhook Processing Error', [
                'error' => $e->getMessage(),
                'webhook_data' => $webhookData
            ]);
            
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Processar mudança de status do pagamento
     */
    private function handlePaymentStatusChange(array $paymentData)
    {
        $externalReference = $paymentData['external_reference'];
        $status = $paymentData['status'];
        
        // Extrair establishment_id do external_reference
        if (preg_match('/establishment_(\d+)_plan_(\d+)_/', $externalReference, $matches)) {
            $establishmentId = $matches[1];
            $planId = $matches[2];
            
            $establishment = \App\Models\Establishment::find($establishmentId);
            $plan = \App\Models\Plan::find($planId);
            
            if ($establishment && $plan) {
                if ($status === 'approved') {
                    // Ativar plano
                    $establishment->update([
                        'plan_id' => $plan->id,
                        'subscription_status' => 'active',
                        'subscription_started_at' => now(),
                        'subscription_expires_at' => now()->addMonths(1), // Renovação mensal
                        'mercadopago_payment_id' => $paymentData['payment_id'],
                        'subscription_metadata' => [
                            'payment_method' => 'pix',
                            'mercadopago_payment_id' => $paymentData['payment_id'],
                            'external_reference' => $externalReference,
                            'approved_at' => $paymentData['approved_at'],
                            'amount_paid' => $paymentData['paid_amount'],
                        ]
                    ]);
                    
                    // Atualizar registro do pagamento na tabela subscription_payments
                    $subscriptionPayment = \App\Models\SubscriptionPayment::where('mercadopago_payment_id', $paymentData['payment_id'])->first();
                    if ($subscriptionPayment) {
                        $subscriptionPayment->update([
                            'status' => 'approved',
                            'mercadopago_status' => $status,
                            'admin_status' => 'verified',
                            'admin_notes' => 'Pagamento aprovado automaticamente via webhook MercadoPago',
                            'mercadopago_data' => array_merge($subscriptionPayment->mercadopago_data ?? [], $paymentData),
                            'approved_at' => $paymentData['approved_at'] ?? now(),
                        ]);
                        
                        Log::info('Subscription Payment Updated', [
                            'subscription_payment_id' => $subscriptionPayment->id,
                            'payment_id' => $paymentData['payment_id'],
                            'new_status' => 'approved'
                        ]);
                    }
                    
                    Log::info('Plan Activated via PIX Payment', [
                        'establishment_id' => $establishmentId,
                        'plan_id' => $planId,
                        'payment_id' => $paymentData['payment_id'],
                        'amount' => $paymentData['paid_amount']
                    ]);
                    
                    // Criar notificação de sucesso
                    $this->createPaymentSuccessNotification($establishment, $plan, $paymentData);
                    
                } else if (in_array($status, ['cancelled', 'rejected', 'refunded'])) {
                    Log::warning('PIX Payment Failed', [
                        'establishment_id' => $establishmentId,
                        'plan_id' => $planId,
                        'payment_id' => $paymentData['payment_id'],
                        'status' => $status
                    ]);
                    
                    // Criar notificação de falha
                    $this->createPaymentFailureNotification($establishment, $plan, $paymentData);
                }
            }
        }
    }
    
    /**
     * Criar notificação de pagamento aprovado
     */
    private function createPaymentSuccessNotification($establishment, $plan, $paymentData)
    {
        try {
            \App\Models\Notification::create([
                'establishment_id' => $establishment->id,
                'title' => 'Plano Ativado com Sucesso!',
                'message' => "Seu pagamento via PIX foi aprovado e o plano {$plan->name} foi ativado. Valor pago: R$ " . number_format($paymentData['paid_amount'], 2, ',', '.'),
                'type' => 'payment_success',
                'read' => false,
                'metadata' => [
                    'payment_id' => $paymentData['payment_id'],
                    'plan_name' => $plan->name,
                    'amount' => $paymentData['paid_amount']
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create payment success notification', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Criar notificação de pagamento rejeitado
     */
    private function createPaymentFailureNotification($establishment, $plan, $paymentData)
    {
        try {
            \App\Models\Notification::create([
                'establishment_id' => $establishment->id,
                'title' => 'Pagamento não aprovado',
                'message' => "O pagamento via PIX para o plano {$plan->name} não foi aprovado. Status: {$paymentData['status']}. Tente novamente ou entre em contato com o suporte.",
                'type' => 'payment_failed',
                'read' => false,
                'metadata' => [
                    'payment_id' => $paymentData['payment_id'],
                    'plan_name' => $plan->name,
                    'status' => $paymentData['status']
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create payment failure notification', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Criar pagamento PIX para taxa de agendamento (estabelecimentos cobrando clientes)
     */
    public function createBookingPixPayment(array $paymentData)
    {
        try {
            $client = new PaymentClient();
            
            // Montar dados do pagamento para taxa de agendamento
            $request = [
                'transaction_amount' => (float) $paymentData['amount'],
                'description' => $paymentData['description'],
                'payment_method_id' => 'pix',
                'payer' => [
                    'email' => $paymentData['payer']['email'],
                    'first_name' => $paymentData['payer']['first_name'],
                    'last_name' => $paymentData['payer']['last_name'],
                ],
                'metadata' => [
                    'appointment_id' => $paymentData['appointment_id'] ?? null,
                    'establishment_id' => $this->establishment->id ?? null,
                    'transaction_id' => $paymentData['transaction_id'] ?? null,
                ],
                // 'date_of_expiration' => Carbon::now()->addMinutes(30)->format('Y-m-d\TH:i:s.v-03:00'), // Optional field causing issues
            ];
            
            // Adicionar CPF se fornecido
            if (!empty($paymentData['payer']['cpf'])) {
                $request['payer']['identification'] = [
                    'type' => 'CPF',
                    'number' => $paymentData['payer']['cpf']
                ];
            }
            
            // Adicionar external_reference para rastreamento
            $request['external_reference'] = 'booking_' . ($paymentData['appointment_id'] ?? 'unknown') . '_' . time();
            
            // Log booking payment creation only in debug mode
            if (config('app.debug')) {
                Log::debug('Booking PIX Payment Request', [
                    'appointment_id' => $paymentData['appointment_id'] ?? null,
                    'amount' => $request['transaction_amount'],
                    'establishment_id' => $this->establishment->id ?? null
                ]);
            }
            
            $payment = $client->create($request);
            
            // Log successful booking payment creation
            Log::info('Booking PIX Payment Created', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'appointment_id' => $paymentData['appointment_id'] ?? null,
                'amount' => $payment->transaction_amount,
                'establishment_id' => $this->establishment->id ?? null
            ]);
            
            return [
                'success' => true,
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'qr_code' => $payment->point_of_interaction->transaction_data->qr_code ?? null,
                'qr_code_base64' => $payment->point_of_interaction->transaction_data->qr_code_base64 ?? null,
                'ticket_url' => $payment->point_of_interaction->transaction_data->ticket_url ?? null,
                'external_reference' => $payment->external_reference,
                'expires_at' => $payment->date_of_expiration,
                'amount' => $payment->transaction_amount,
            ];
            
        } catch (\Exception $e) {
            Log::error('MercadoPago Booking PIX Payment Error', [
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'establishment_id' => $this->establishment->id ?? null,
                'appointment_id' => $paymentData['appointment_id'] ?? null,
                'request_data' => $request ?? null,
                'exception_class' => get_class($e)
            ]);
            
            // Try to get more detailed error from MercadoPago
            $errorDetails = 'Erro desconhecido';
            
            // Check if it's a MercadoPago exception
            if ($e instanceof \MercadoPago\Exceptions\MPApiException) {
                $statusCode = $e->getStatusCode();
                $apiResponse = $e->getApiResponse();
                
                Log::error('MPApiException detected', [
                    'status_code' => $statusCode,
                    'api_response' => $apiResponse
                ]);
                
                // Try to extract actual error details from response
                // Convert MPResponse object to array if needed
                if ($apiResponse && is_object($apiResponse)) {
                    // Try to convert object to array using reflection
                    $responseArray = json_decode(json_encode($apiResponse), true);
                } else {
                    $responseArray = $apiResponse;
                }
                
                if ($responseArray && isset($responseArray['message'])) {
                    $errorDetails = $responseArray['message'];
                } elseif ($responseArray && isset($responseArray['cause'])) {
                    $errorDetails = json_encode($responseArray['cause']);
                } else {
                    $errorDetails = "HTTP {$statusCode}: " . ($responseArray ? json_encode($responseArray) : 'No response body');
                }
            }
            
            // Try reflection to get all available methods
            $reflection = new \ReflectionClass($e);
            $methods = $reflection->getMethods(\ReflectionMethod::IS_PUBLIC);
            $availableMethods = array_map(function($method) {
                return $method->getName();
            }, $methods);
            
            Log::error('Exception methods available', [
                'methods' => $availableMethods,
                'properties' => array_keys(get_object_vars($e))
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_details' => $errorDetails,
                'exception_class' => get_class($e)
            ];
        }
    }
    
    
    
    /**
     * Mapear status do MercadoPago para status interno
     */
    public static function mapStatusToInternal(string $mercadoPagoStatus): string
    {
        return match($mercadoPagoStatus) {
            'pending' => 'waiting_payment',
            'approved' => 'paid',
            'authorized' => 'authorized',
            'in_process' => 'processing',
            'in_mediation' => 'in_mediation',
            'rejected' => 'cancelled',
            'cancelled' => 'cancelled',
            'refunded' => 'refunded',
            'charged_back' => 'charged_back',
            default => 'pending'
        };
    }
    
    
    /**
     * Obter chave pública para frontend
     */
    public function getPublicKey()
    {
        return $this->publicKey;
    }
}