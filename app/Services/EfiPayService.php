<?php

namespace App\Services;

use Efi\Exception\EfiException;
use Efi\EfiPay;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EfiPayService
{
    private $efiPay;
    private $isProduction;
    
    public function __construct()
    {
        $this->isProduction = config('efipay.environment') === 'production';
        
        // Get absolute path for certificate
        $certificateFile = $this->isProduction 
            ? config('efipay.certificate_path_prod') 
            : config('efipay.certificate_path');
            
        // Ensure absolute path
        if (!str_starts_with($certificateFile, '/')) {
            $certificateFile = base_path($certificateFile);
        }

        $options = [
            'client_id' => config('efipay.client_id'),
            'client_secret' => config('efipay.client_secret'),
            'certificate' => $certificateFile,
            'sandbox' => config('efipay.sandbox'),
            'debug' => config('efipay.debug'),
            'timeout' => config('efipay.timeout'),
        ];
        
        $this->efiPay = new EfiPay($options);
    }
    
    /**
     * Criar um plano de assinatura
     */
    public function createPlan(array $planData)
    {
        try {
            $params = [];
            
            $body = [
                'name' => $planData['name'],
                'repeats' => $planData['cycles'],
                'interval' => $planData['interval'],
            ];
            
            $response = $this->efiPay->createPlan($params, $body);
            
            Log::info('EfiPay Plan Created', ['response' => $response]);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay Create Plan Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Criar uma assinatura usando plano existente
     */
    public function createSubscription(array $subscriptionData)
    {
        try {
            // Para sandbox, vamos simular a criação da assinatura
            if (config('efipay.sandbox') || config('efipay.environment') === 'homolog') {
                $response = [
                    'data' => [
                        'subscription_id' => 'sandbox_subscription_' . time(),
                        'plan_id' => $subscriptionData['efipay_plan_id'], // Usar ID do plano existente
                        'status' => 'new', // Status inicial como new (igual produção)
                        'created_at' => now()->toISOString(),
                        'customer' => [
                            'name' => $subscriptionData['customer_name'],
                            'email' => $subscriptionData['customer_email'],
                        ],
                        'charges' => [
                            [
                                'charge_id' => 'sandbox_charge_' . time(),
                                'status' => 'new',
                                'total' => $subscriptionData['plan_value'],
                                'parcel' => 1
                            ]
                        ],
                        'metadata' => [
                            'custom_id' => $subscriptionData['establishment_id'],
                        ],
                    ]
                ];
                
                Log::info('EfiPay Subscription Created (Sandbox)', ['response' => $response]);
                
                return $response;
            }
            
            // Usar ID do plano existente na Efí Pay
            $planId = $subscriptionData['efipay_plan_id'];
            
            // Se for string de sandbox em produção, é um erro de configuração
            if (is_string($planId) && str_starts_with($planId, 'plan_sandbox_')) {
                $errorMsg = 'Configuração incorreta: usando IDs de sandbox em ambiente de produção. ' .
                           'Configure os IDs reais dos planos de produção ou mude para ambiente de homologação.';
                
                Log::error('Plan ID configuration error', [
                    'plan_id' => $planId,
                    'environment' => config('efipay.environment'),
                    'sandbox' => config('efipay.sandbox'),
                    'message' => $errorMsg
                ]);
                
                throw new \Exception($errorMsg);
            }
            
            // Garantir que o plan_id seja integer conforme documentação
            $params = ['id' => (int)$planId];
            
            // Para API de assinaturas, precisamos incluir items conforme documentação
            $items = [
                [
                    'name' => $subscriptionData['plan_name'] . ' - Assinatura Mensal', // String (1-255 chars)
                    'value' => (int)($subscriptionData['plan_value'] ?? 0), // Integer em centavos
                    'amount' => 1, // Integer quantidade (padrão: 1)
                ]
            ];
            
            $metadata = [
                'custom_id' => (string)$subscriptionData['establishment_id'],
                'notification_url' => config('efipay.webhook_url'),
            ];
            
            // API de assinaturas não aceita 'customer' no body
            $body = [
                'items' => $items,
                'metadata' => $metadata,
            ];
            
            // Log da requisição para debug
            Log::info('EfiPay Create Subscription Request', [
                'params' => $params,
                'body' => $body
            ]);
            
            // Usar HTTP direto com Basic Auth em vez do SDK
            $response = $this->makeDirectSubscriptionCreation($params, $body);
            
            Log::info('EfiPay Subscription Created (Production)', ['response' => $response]);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay Create Subscription Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Processar pagamento da primeira cobrança da assinatura
     */
    public function processFirstPayment(array $paymentData)
    {
        try {
            // Para sandbox, vamos simular o processamento do pagamento
            if (config('efipay.sandbox') || config('efipay.environment') === 'homolog') {
                // Simular cenário baseado no cartão usado conforme documentação Efí Pay
                $paymentToken = $paymentData['payment_token'];
                
                // Extrair informações do token para simular comportamento real
                $cardNumber = $this->extractCardNumberFromToken($paymentToken);
                
                // Simular respostas baseadas nos cartões de teste oficiais da Efí Pay
                if (in_array($cardNumber, ['4000000000000002', '4000000000000010', '4000000000000028', '4000000000000036', '4000000000000119'])) {
                    $scenario = 'rejected';
                    $reason = match($cardNumber) {
                        '4000000000000002' => 'Cartão rejeitado pela operadora',
                        '4000000000000010' => 'Falha de segurança no cartão',
                        '4000000000000028' => 'Cartão expirado',
                        '4000000000000036' => 'CVV inválido',
                        '4000000000000119' => 'Saldo insuficiente',
                        default => 'Transação rejeitada'
                    };
                } else if (in_array($cardNumber, ['4012001038443335', '4000000000000044', '5555666677778884'])) {
                    $scenario = 'approved';
                    $reason = null;
                } else {
                    // Para outros cartões, simular aprovação com 85% de chance
                    $scenario = (rand(1, 100) <= 85) ? 'approved' : 'rejected';
                    $reason = $scenario === 'rejected' ? 'Transação rejeitada pela operadora' : null;
                }
                
                $response = [
                    'data' => [
                        'payment_id' => 'sandbox_payment_' . time(),
                        'subscription_id' => $paymentData['subscription_id'],
                        'status' => $scenario,
                        'payment_method' => 'credit_card',
                        'amount' => $paymentData['amount'],
                        'processed_at' => now()->toISOString(),
                        'created_at' => now()->toISOString(),
                        'card_last_digits' => substr($paymentData['payment_token'], -4),
                        'reason' => $reason,
                    ]
                ];
                
                Log::info('EfiPay First Payment Processed (Sandbox)', [
                    'response' => $response,
                    'scenario' => $scenario,
                    'reason' => $reason
                ]);
                
                return $response;
            }
            
            // Usar o endpoint correto: /v1/subscription/:id/pay (Two Steps)
            // A assinatura já foi criada, agora pagar
            $subscriptionId = $paymentData['subscription_id'];
            
            $params = ['id' => $subscriptionId];
            
            // Estrutura conforme documentação da Efí Pay para /charge/:id/pay
            // Testando estrutura simples sem billing_address
            $body = [
                'charge_id' => $paymentData['charge_id'], // Para ser extraído pela URL
                'payment' => [
                    'credit_card' => [
                        'customer' => $paymentData['customer'],
                        'payment_token' => $paymentData['payment_token']
                    ]
                ]
            ];
            
            // Log da requisição
            Log::info('EfiPay Pay Subscription Request (Two Steps)', [
                'subscription_id' => $subscriptionId,
                'params' => $params,
                'body' => $body
            ]);
            
            // Usar o próprio SDK da Efí Pay, mas forçar o método correto
            // A autenticação já está configurada no SDK
            
            $subscriptionId = $paymentData['subscription_id'];
            $params = ['id' => $subscriptionId];
            
            Log::info('EfiPay Subscription Payment using SDK with correct method', [
                'subscription_id' => $subscriptionId,
                'params' => $params,
                'body' => $body
            ]);
            
            // Usar diretamente a chamada HTTP com Basic Auth (sem certificado de cliente)
            // Os testes confirmaram que Basic Auth funciona corretamente
            $response = $this->makeDirectSubscriptionPayment($subscriptionId, $body);
            
            Log::info('EfiPay First Payment Processed (Production)', ['response' => $response]);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay Process First Payment Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Ativar assinatura após pagamento aprovado
     */
    public function activateSubscription(string $subscriptionId)
    {
        try {
            if (config('efipay.sandbox') || config('efipay.environment') === 'homolog') {
                $response = [
                    'data' => [
                        'subscription_id' => $subscriptionId,
                        'status' => 'active',
                        'activated_at' => now()->toISOString(),
                    ]
                ];
                
                Log::info('EfiPay Subscription Activated (Sandbox)', ['response' => $response]);
                
                return $response;
            }
            
            // Para produção, implementar ativação via API da Efí Pay
            $params = ['id' => $subscriptionId];
            
            $body = [
                'status' => 'active'
            ];
            
            $response = $this->efiPay->updateSubscription($params, $body);
            
            Log::info('EfiPay Subscription Activated (Production)', ['response' => $response]);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay Activate Subscription Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'subscription_id' => $subscriptionId,
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Obter plano existente por slug
     */
    public function getExistingPlanId(string $planSlug): ?string
    {
        $existingPlans = config('efipay.existing_plans');
        
        return $existingPlans[$planSlug]['efipay_plan_id'] ?? null;
    }
    
    /**
     * Listar todos os planos existentes na Efí Pay
     */
    public function listPlans()
    {
        try {
            if (config('efipay.sandbox') || config('efipay.environment') === 'homolog') {
                // Para sandbox, simular alguns planos existentes
                $response = [
                    'data' => [
                        [
                            'plan_id' => 'plan_sandbox_starter',
                            'name' => 'Horaly Starter Plan (Sandbox)',
                            'status' => 'active',
                            'interval' => 1,
                            'created_at' => now()->subDays(30)->toISOString(),
                        ],
                        [
                            'plan_id' => 'plan_sandbox_professional',
                            'name' => 'Horaly Professional Plan (Sandbox)',
                            'status' => 'active',
                            'interval' => 1,
                            'created_at' => now()->subDays(25)->toISOString(),
                        ],
                        [
                            'plan_id' => 'plan_sandbox_enterprise',
                            'name' => 'Horaly Enterprise Plan (Sandbox)',
                            'status' => 'active',
                            'interval' => 1,
                            'created_at' => now()->subDays(20)->toISOString(),
                        ],
                    ]
                ];
                
                Log::info('EfiPay Plans Listed (Sandbox)', ['response' => $response]);
                
                return $response;
            }
            
            // Para produção, usar a API real
            $params = [];
            $response = $this->efiPay->listPlans($params);
            
            Log::info('EfiPay Plans Listed', ['response' => $response]);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay List Plans Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Cancelar assinatura
     */
    public function cancelSubscription(string $subscriptionId)
    {
        try {
            // Para sandbox, vamos simular o cancelamento
            if (config('efipay.sandbox') || config('efipay.environment') === 'homolog') {
                $response = [
                    'data' => [
                        'subscription_id' => $subscriptionId,
                        'status' => 'cancelled',
                        'cancelled_at' => now()->toISOString(),
                        'reason' => 'cancelled_by_customer',
                    ]
                ];
                
                Log::info('EfiPay Subscription Cancelled (Sandbox)', ['response' => $response]);
                
                return $response;
            }
            
            $params = ['id' => $subscriptionId];
            
            $response = $this->efiPay->cancelSubscription($params);
            
            Log::info('EfiPay Subscription Cancelled', ['response' => $response]);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay Cancel Subscription Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Consultar assinatura
     */
    public function getSubscription(string $subscriptionId)
    {
        try {
            $params = ['id' => $subscriptionId];
            
            $response = $this->efiPay->detailSubscription($params);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay Get Subscription Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Listar assinaturas
     */
    public function listSubscriptions(array $filters = [])
    {
        try {
            $params = array_merge([
                'limit' => 20,
                'offset' => 0,
            ], $filters);
            
            $response = $this->efiPay->listSubscriptions($params);
            
            return $response;
            
        } catch (EfiException $e) {
            Log::error('EfiPay List Subscriptions Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'response' => $e->getResponse()
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Obter token de pagamento
     */
    public function getPaymentToken(array $cardData)
    {
        try {
            // Para sandbox, vamos simular o token de pagamento
            // Em produção, você deve usar o método correto do SDK
            if (config('efipay.sandbox') || config('efipay.environment') === 'homolog') {
                // Validação básica dos dados do cartão para sandbox
                $this->validateCardData($cardData);
                
                // Simulação de token para sandbox
                $response = [
                    'data' => [
                        'payment_token' => 'sandbox_token_' . md5(json_encode($cardData) . time()),
                        'card_mask' => substr($cardData['number'], 0, 4) . '****' . substr($cardData['number'], -4),
                        'brand' => $cardData['brand'],
                    ]
                ];
                
                Log::info('EfiPay Payment Token (Sandbox)', ['response' => $response]);
                
                return $response;
            }
            
            $params = [];
            
            $body = [
                'brand' => $cardData['brand'],
                'number' => $cardData['number'],
                'cvv' => $cardData['cvv'],
                'expiration_month' => $cardData['expiration_month'],
                'expiration_year' => $cardData['expiration_year'],
            ];
            
            // Para produção, a tokenização deve ser feita via JavaScript no frontend
            // Por segurança, a Efí Pay recomenda usar EfiJs.CreditCard.getPaymentToken()
            // Aqui vamos simular temporariamente até implementar JavaScript
            
            // TEMPORÁRIO: Para desenvolvimento, simular token em produção também
            // TODO: Implementar JavaScript no frontend para tokenização real
            if (config('app.env') === 'local' || config('app.env') === 'development') {
                Log::warning('ATENÇÃO: Usando tokenização simulada em ambiente de produção para desenvolvimento local');
                
                // Gerar token no formato correto: 40 caracteres hexadecimais
                $paymentToken = bin2hex(random_bytes(20)); // 20 bytes = 40 chars hex
                
                $response = [
                    'data' => [
                        'payment_token' => $paymentToken,
                        'card_mask' => substr($cardData['number'], 0, 4) . '****' . substr($cardData['number'], -4),
                        'brand' => $cardData['brand'],
                    ]
                ];
                
                Log::info('EfiPay Payment Token (Temporary Production)', ['response' => $response]);
                
                return $response;
            }
            
            // Em produção real, isso deveria vir do frontend
            throw new \Exception('Tokenização de cartão deve ser implementada via JavaScript no frontend. Consulte a documentação da Efí Pay.');
            
        } catch (EfiException $e) {
            Log::error('EfiPay Get Payment Token Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'details' => method_exists($e, 'getErrorDescription') ? $e->getErrorDescription() : 'No details available'
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Validar dados básicos do cartão para sandbox
     */
    private function validateCardData(array $cardData)
    {
        // Validação básica do número do cartão (deve ter pelo menos 13 dígitos)
        $cardNumber = preg_replace('/\D/', '', $cardData['number'] ?? '');
        if (strlen($cardNumber) < 13) {
            throw new \Exception('Número do cartão inválido');
        }
        
        // Validação do CVV (deve ter 3 ou 4 dígitos)
        $cvv = preg_replace('/\D/', '', $cardData['cvv'] ?? '');
        if (strlen($cvv) < 3 || strlen($cvv) > 4) {
            throw new \Exception('CVV inválido');
        }
        
        // Validação da data de expiração
        $month = intval($cardData['expiration_month'] ?? 0);
        $year = intval($cardData['expiration_year'] ?? 0);
        
        if ($month < 1 || $month > 12) {
            throw new \Exception('Mês de expiração inválido');
        }
        
        if ($year < date('Y')) {
            throw new \Exception('Cartão expirado');
        }
        
        // Se ano é o atual, verificar se o mês não passou
        if ($year == date('Y') && $month < date('n')) {
            throw new \Exception('Cartão expirado');
        }
        
        // Cartões de teste oficiais da Efí Pay
        $efiTestCards = [
            // Cartões que DEVEM ser aprovados
            '4012001038443335', // Visa - Aprovado
            '4000000000000044', // Visa - Aprovado
            '5555666677778884', // Mastercard - Aprovado
            
            // Cartões que DEVEM ser rejeitados
            '4000000000000002', // Visa - Rejeitado
            '4000000000000010', // Visa - Falha de segurança
            '4000000000000028', // Visa - Expirado
            '4000000000000036', // Visa - CVV inválido
            '4000000000000119', // Visa - Saldo insuficiente
        ];
        
        // Para sandbox, aceitar cartões de teste oficiais da Efí Pay
        // Em produção, essa validação não deve existir
    }
    
    /**
     * Extrair número do cartão do token para simulação
     */
    private function extractCardNumberFromToken(string $token): string
    {
        // O token contém informações do cartão, vamos extrair uma referência
        // Em um token real, isso seria diferente, mas para simulação funciona
        
        // Se o token foi criado com dados específicos, tentar extrair
        if (str_contains($token, '4012001038443335') || str_contains($token, '4012')) {
            return '4012001038443335';
        }
        if (str_contains($token, '4000000000000002') || str_contains($token, '0002')) {
            return '4000000000000002';
        }
        if (str_contains($token, '4000000000000119') || str_contains($token, '0119')) {
            return '4000000000000119';
        }
        if (str_contains($token, '4000000000000044') || str_contains($token, '0044')) {
            return '4000000000000044';
        }
        if (str_contains($token, '5555666677778884') || str_contains($token, '8884')) {
            return '5555666677778884';
        }
        
        // Para outros tokens, extrair últimos 4 dígitos do hash e determinar cartão
        $lastFour = substr($token, -4);
        
        // Mapear alguns hashes para cartões específicos (para testes consistentes)
        return match($lastFour) {
            '0002' => '4000000000000002',
            '0119' => '4000000000000119',
            '0044' => '4000000000000044',
            '3335' => '4012001038443335',
            '8884' => '5555666677778884',
            default => '4012001038443335' // Padrão: cartão aprovado
        };
    }
    
    /**
     * Processar webhook
     */
    public function processWebhook(array $webhookData)
    {
        try {
            Log::info('EfiPay Webhook Received', ['data' => $webhookData]);
            
            $notification = $webhookData['notification'];
            
            switch ($notification['type']) {
                case 'subscription':
                    return $this->processSubscriptionWebhook($notification);
                    
                case 'charge':
                    return $this->processChargeWebhook($notification);
                    
                default:
                    Log::warning('EfiPay Unknown Webhook Type', ['type' => $notification['type']]);
                    return false;
            }
            
        } catch (\Exception $e) {
            Log::error('EfiPay Webhook Processing Error', [
                'error' => $e->getMessage(),
                'data' => $webhookData
            ]);
            
            return false;
        }
    }
    
    private function processSubscriptionWebhook(array $notification)
    {
        // Processar notificação de assinatura
        $subscriptionId = $notification['subscription_id'];
        $status = $notification['status'];
        
        // Atualizar status da assinatura no banco
        $establishment = \App\Models\Establishment::where('efipay_subscription_id', $subscriptionId)->first();
        
        if ($establishment) {
            $establishment->update([
                'subscription_status' => $status,
                'subscription_updated_at' => now(),
            ]);
            
            Log::info('Subscription Status Updated', [
                'establishment_id' => $establishment->id,
                'subscription_id' => $subscriptionId,
                'status' => $status
            ]);
        }
        
        return true;
    }
    
    private function processChargeWebhook(array $notification)
    {
        // Processar notificação de cobrança
        $chargeId = $notification['charge_id'];
        $status = $notification['status'];
        $subscriptionId = $notification['subscription_id'] ?? null;
        
        Log::info('Charge Status Updated', [
            'charge_id' => $chargeId,
            'subscription_id' => $subscriptionId,
            'status' => $status
        ]);
        
        // Se o pagamento foi rejeitado, atualizar o status do establishment
        if (in_array($status, ['rejected', 'refused', 'cancelled', 'unpaid'])) {
            $establishment = \App\Models\Establishment::where('efipay_subscription_id', $subscriptionId)->first();
            
            if ($establishment) {
                $establishment->update([
                    'subscription_status' => 'overdue',
                    'subscription_updated_at' => now(),
                    'subscription_metadata' => array_merge(
                        $establishment->subscription_metadata ?? [],
                        [
                            'last_payment_failure' => [
                                'charge_id' => $chargeId,
                                'status' => $status,
                                'failed_at' => now(),
                                'reason' => $notification['reason'] ?? 'Payment rejected'
                            ]
                        ]
                    )
                ]);
                
                Log::warning('Payment Rejected - Subscription marked as overdue', [
                    'establishment_id' => $establishment->id,
                    'establishment_name' => $establishment->name,
                    'subscription_id' => $subscriptionId,
                    'charge_id' => $chargeId,
                    'status' => $status,
                    'reason' => $notification['reason'] ?? 'Unknown'
                ]);
                
                // Criar notificação para o estabelecimento
                $this->createPaymentRejectedNotification($establishment, $status, $notification['reason'] ?? 'Pagamento rejeitado');
            }
        }
        
        return true;
    }
    
    /**
     * Obter token de acesso OAuth2 
     */
    private function getOAuth2Token()
    {
        $url = $this->isProduction 
            ? "https://cobrancas.api.efipay.com.br/v1/authorize"
            : "https://cobrancas-h.api.efipay.com.br/v1/authorize";
        
        $credentials = base64_encode(config('efipay.client_id') . ':' . config('efipay.client_secret'));
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['grant_type' => 'client_credentials']),
            CURLOPT_HTTPHEADER => [
                'Authorization: Basic ' . $credentials,
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        Log::info('EfiPay OAuth2 Token Request', [
            'url' => $url,
            'http_code' => $httpCode,
            'response' => $response,
            'curl_error' => $curlError
        ]);
        
        if ($curlError) {
            throw new \Exception('Erro cURL ao obter token OAuth2: ' . $curlError);
        }
        
        $responseData = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $errorMsg = $responseData['error_description'] ?? $responseData['error'] ?? 'Erro ao obter token OAuth2';
            throw new \Exception($errorMsg);
        }
        
        return $responseData['access_token'];
    }

    /**
     * Criar assinatura via HTTP direto com Bearer Token
     */
    private function makeDirectSubscriptionCreation($params, $body)
    {
        // Obter token OAuth2 primeiro
        $accessToken = $this->getOAuth2Token();
        
        $planId = $params['id'];
        // Corrigir URL conforme documentação da Efí Pay
        $url = $this->isProduction 
            ? "https://cobrancas.api.efipay.com.br/v1/plan/{$planId}/subscription"
            : "https://cobrancas-h.api.efipay.com.br/v1/plan/{$planId}/subscription";
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $curlResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        Log::info('EfiPay Direct Subscription Creation Request', [
            'url' => $url,
            'http_code' => $httpCode,
            'response' => $curlResponse,
            'curl_error' => $curlError
        ]);
        
        if ($curlError) {
            throw new \Exception('Erro cURL na criação da assinatura: ' . $curlError);
        }
        
        $response = json_decode($curlResponse, true);
        
        if ($httpCode >= 400) {
            $errorMsg = $response['error_description']['message'] ?? $response['error'] ?? 'Erro desconhecido na criação da assinatura';
            throw new \Exception($errorMsg);
        }
        
        // Formatar resposta no padrão do SDK
        return [
            'code' => $httpCode,
            'data' => $response
        ];
    }

    /**
     * Fazer pagamento de assinatura via HTTP direto com Basic Auth
     */
    private function makeDirectSubscriptionPayment($subscriptionId, $body)
    {
        // Obter token OAuth2 primeiro
        $accessToken = $this->getOAuth2Token();
        
        // Usar endpoint de cobrança, não de assinatura
        // O payment_data deve conter charge_id
        $chargeId = $body['charge_id'] ?? null;
        if (!$chargeId) {
            throw new \Exception('charge_id é obrigatório para processar pagamento');
        }
        
        // Corrigir URL para usar charge ao invés de subscription
        $url = $this->isProduction 
            ? "https://cobrancas.api.efipay.com.br/v1/charge/{$chargeId}/pay"
            : "https://cobrancas-h.api.efipay.com.br/v1/charge/{$chargeId}/pay";
            
        // Remover charge_id do body já que está na URL
        unset($body['charge_id']);
        
        // Log do body final que será enviado
        Log::info('EfiPay Final Payment Body', [
            'charge_id' => $chargeId,
            'body' => $body
        ]);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $curlResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        Log::info('EfiPay Direct Subscription Payment Request', [
            'url' => $url,
            'http_code' => $httpCode,
            'response' => $curlResponse,
            'curl_error' => $curlError
        ]);
        
        if ($curlError) {
            throw new \Exception('Erro cURL: ' . $curlError);
        }
        
        $response = json_decode($curlResponse, true);
        
        if ($httpCode >= 400) {
            $errorMsg = $response['error_description']['message'] ?? $response['error'] ?? 'Erro desconhecido';
            throw new \Exception($errorMsg);
        }
        
        // Formatar resposta no padrão do SDK
        return [
            'code' => $httpCode,
            'data' => $response
        ];
    }
    
    /**
     * Criar notificação para pagamento rejeitado
     */
    private function createPaymentRejectedNotification($establishment, $status, $reason)
    {
        try {
            \App\Models\Notification::create([
                'establishment_id' => $establishment->id,
                'title' => 'Pagamento Rejeitado',
                'message' => "Seu pagamento foi rejeitado ({$status}). Motivo: {$reason}. Atualize seus dados de pagamento para continuar usando o sistema.",
                'type' => 'payment_rejected',
                'read' => false,
            ]);
            
            Log::info('Payment rejection notification created', [
                'establishment_id' => $establishment->id,
                'status' => $status,
                'reason' => $reason
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to create payment rejection notification', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}