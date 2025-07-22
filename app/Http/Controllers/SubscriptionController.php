<?php

namespace App\Http\Controllers;

use App\Models\Establishment;
use App\Models\Plan;
use App\Models\SubscriptionPayment;
use App\Services\EfiPayService;
use App\Services\MercadoPagoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    private EfiPayService $efiPayService;
    private MercadoPagoService $mercadoPagoService;

    public function __construct(EfiPayService $efiPayService, MercadoPagoService $mercadoPagoService)
    {
        $this->efiPayService = $efiPayService;
        $this->mercadoPagoService = $mercadoPagoService;
    }

    /**
     * Display the subscription management page
     */
    public function index(): Response
    {
        $establishment = Auth::user()->establishment;
        $plans = Plan::where('is_active', true)->get();

        // Transform plans to include all needed fields
        $transformedPlans = $plans->map(function ($plan) {
            // Define service limits based on plan name
            $serviceLimit = match (strtolower($plan->name)) {
                'starter' => 5,
                'professional' => 10,
                'enterprise' => '∞',
                default => 5
            };
            
            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description,
                'price' => $plan->price,
                'billing_cycle' => $plan->billing_cycle,
                'features' => $plan->features,
                'monthly_appointment_limit' => $plan->monthly_appointment_limit,
                'unlimited_appointments' => $plan->unlimited_appointments,
                'appointment_limit' => $plan->unlimited_appointments ? '∞' : $plan->monthly_appointment_limit,
                'service_limit' => $serviceLimit,
                'landing_page' => $plan->hasFeature('landing_page') || $plan->hasFeature('custom_branding'),
                'whatsapp_integration' => $plan->hasFeature('whatsapp_integration') || $plan->hasFeature('notifications'),
                'custom_domain' => $plan->hasFeature('custom_domain'),
                'priority_support' => $plan->hasFeature('priority_support') || $plan->hasFeature('support'),
                'analytics' => $plan->hasFeature('analytics') || $plan->hasFeature('reports'),
                'reports' => $plan->hasFeature('reports'),
                'is_active' => $plan->is_active,
            ];
        });

        // Preparar dados do establishment com formatação adequada
        $establishmentData = $establishment->load('plan');
        
        // Verificar e corrigir datas inválidas (timestamp 0 ou epoch)
        $trialEndsAt = $establishmentData->trial_ends_at;
        $subscriptionExpiresAt = $establishmentData->subscription_expires_at;
        
        // Converter para array e limpar datas inválidas
        $establishmentArray = $establishmentData->toArray();
        
        // Se a data for anterior a 2020 (provavelmente timestamp 0), definir como null
        if ($trialEndsAt && $trialEndsAt->year < 2020) {
            $establishmentArray['trial_ends_at'] = null;
        }
        
        if ($subscriptionExpiresAt && $subscriptionExpiresAt->year < 2020) {
            $establishmentArray['subscription_expires_at'] = null;
        }

        return Inertia::render('establishment/subscription/Index', [
            'establishment' => $establishmentArray,
            'plans' => $transformedPlans,
            'currentServiceCount' => $establishment->services()->count(),
            'currentPlan' => $establishment->plan ? [
                'id' => $establishment->plan->id,
                'name' => $establishment->plan->name,
                'description' => $establishment->plan->description,
                'price' => $establishment->plan->price,
                'appointment_limit' => $establishment->plan->unlimited_appointments ? '∞' : $establishment->plan->monthly_appointment_limit,
                'service_limit' => match (strtolower($establishment->plan->name)) {
                    'starter' => 5,
                    'professional' => 10,
                    'enterprise' => '∞',
                    default => 5
                },
                'landing_page' => $establishment->plan->hasFeature('landing_page') || $establishment->plan->hasFeature('custom_branding'),
                'whatsapp_integration' => $establishment->plan->hasFeature('whatsapp_integration') || $establishment->plan->hasFeature('notifications'),
                'custom_domain' => $establishment->plan->hasFeature('custom_domain'),
                'priority_support' => $establishment->plan->hasFeature('priority_support') || $establishment->plan->hasFeature('support'),
                'analytics' => $establishment->plan->hasFeature('analytics'),
                'reports' => $establishment->plan->hasFeature('reports'),
                'features' => $establishment->plan->features,
            ] : null,
            'subscriptionStatus' => [
                'status' => $establishment->subscription_status,
                'label' => $establishment->getSubscriptionStatusLabel(),
                'canUse' => $establishment->canUse(),
                'isInTrial' => $establishment->isInTrial(),
                'trialDaysRemaining' => $establishment->getTrialDaysRemaining(),
                'hasActiveSubscription' => $establishment->hasActiveSubscription(),
                'hasExpiredSubscription' => $establishment->hasExpiredSubscription(),
            ],
            'planFeatures' => $establishment->plan?->features ?? [],
        ]);
    }

    /**
     * Criar pagamento PIX para plano
     */
    public function createPixPayment(Request $request)
    {
        try {
            $request->validate([
                'plan_id' => 'required|exists:plans,id',
            ], [
                'plan_id.required' => 'Plano é obrigatório.',
                'plan_id.exists' => 'Plano selecionado não existe.',
            ]);

            $establishment = Auth::user()->establishment;
            if (!$establishment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estabelecimento não encontrado.'
                ], 404);
            }

            $plan = Plan::findOrFail($request->plan_id);

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
                    'cpf' => $establishment->user->cpf ?? '00000000000', // Usar CPF real se disponível
                ]
            ];

            $result = $this->mercadoPagoService->createPixPayment($paymentData);

            if ($result['success']) {
                // Gravar pagamento no banco de dados
                $subscriptionPayment = SubscriptionPayment::create([
                    'establishment_id' => $establishment->id,
                    'plan_id' => $plan->id,
                    'mercadopago_payment_id' => $result['payment_id'],
                    'external_reference' => $result['external_reference'],
                    'amount' => $plan->price,
                    'description' => $paymentData['description'],
                    'status' => 'pending',
                    'mercadopago_status' => 'pending',
                    'qr_code' => $result['qr_code'],
                    'qr_code_base64' => $result['qr_code_base64'],
                    'ticket_url' => $result['ticket_url'] ?? null,
                    'mercadopago_data' => $result,
                    'expires_at' => $result['expires_at'] ? \Carbon\Carbon::parse($result['expires_at']) : null,
                    'admin_status' => 'pending',
                ]);

                Log::info('PIX Payment Created and Saved', [
                    'establishment_id' => $establishment->id,
                    'plan_id' => $plan->id,
                    'payment_id' => $result['payment_id'],
                    'amount' => $plan->price,
                    'subscription_payment_id' => $subscriptionPayment->id,
                ]);

                return response()->json([
                    'success' => true,
                    'payment_id' => $result['payment_id'],
                    'qr_code' => $result['qr_code'],
                    'qr_code_base64' => $result['qr_code_base64'],
                    'amount' => $result['amount'],
                    'expires_at' => $result['expires_at'],
                    'external_reference' => $result['external_reference'],
                    'subscription_payment_id' => $subscriptionPayment->id,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao gerar pagamento PIX: ' . $result['error']
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('PIX Payment Creation Error', [
                'error' => $e->getMessage(),
                'establishment_id' => $establishment->id ?? null,
                'plan_id' => $plan->id ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro interno. Tente novamente ou entre em contato com o suporte.'
            ], 500);
        }
    }

    /**
     * Verificar status do pagamento PIX
     */
    public function checkPixPaymentStatus($paymentId)
    {
        try {
            $result = $this->mercadoPagoService->getPaymentStatus($paymentId);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'status' => $result['status'],
                    'status_detail' => $result['status_detail'],
                    'approved' => $result['status'] === 'approved',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['error']
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('PIX Payment Status Check Error', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao verificar status do pagamento.'
            ], 500);
        }
    }

    /**
     * Create a new subscription
     */
    public function create(Request $request)
    {
        // Validar se veio token (produção) ou dados do cartão (sandbox)
        if ($request->has('payment_token')) {
            // Modo produção com token gerado no frontend
            $request->validate([
                'plan_id' => 'required|exists:plans,id',
                'payment_token' => 'required|string',
                'card_brand' => 'required|string',
                'card_mask' => 'required|string',
                'customer_data' => 'required|array',
                'customer_data.cpf' => 'required|string',
                'customer_data.birth' => 'required|date',
                'customer_data.phone_number' => 'required|string',
            ], [
                'plan_id.required' => 'Plano é obrigatório.',
                'plan_id.exists' => 'Plano selecionado não existe.',
                'payment_token.required' => 'Token de pagamento é obrigatório.',
                'card_brand.required' => 'Bandeira do cartão é obrigatória.',
                'card_mask.required' => 'Máscara do cartão é obrigatória.',
                'customer_data.required' => 'Dados do titular são obrigatórios.',
                'customer_data.cpf.required' => 'CPF é obrigatório.',
                'customer_data.birth.required' => 'Data de nascimento é obrigatória.',
                'customer_data.phone_number.required' => 'Telefone é obrigatório.',
            ]);
        } else {
            // Modo sandbox com dados do cartão
            $request->validate([
                'plan_id' => 'required|exists:plans,id',
                'payment_data' => 'required|array',
                'payment_data.card_number' => 'required|string',
                'payment_data.card_name' => 'required|string',
                'payment_data.card_cvv' => 'required|string',
                'payment_data.card_expiry_month' => 'required|string',
                'payment_data.card_expiry_year' => 'required|string',
                'payment_data.card_brand' => 'required|string',
            ], [
                'plan_id.required' => 'Plano é obrigatório.',
                'plan_id.exists' => 'Plano selecionado não existe.',
                'payment_data.required' => 'Dados de pagamento são obrigatórios.',
                'payment_data.card_number.required' => 'Número do cartão é obrigatório.',
                'payment_data.card_name.required' => 'Nome no cartão é obrigatório.',
                'payment_data.card_cvv.required' => 'CVV é obrigatório.',
                'payment_data.card_expiry_month.required' => 'Mês de validade é obrigatório.',
                'payment_data.card_expiry_year.required' => 'Ano de validade é obrigatório.',
                'payment_data.card_brand.required' => 'Bandeira do cartão é obrigatória.',
            ]);
        }

        $establishment = Auth::user()->establishment;
        $plan = Plan::findOrFail($request->plan_id);

        DB::beginTransaction();

        try {
            // 1. Obter ou usar token de pagamento
            if ($request->has('payment_token')) {
                // Token já gerado no frontend
                $paymentToken = $request->payment_token;
                $cardBrand = $request->card_brand;
                $cardMask = $request->card_mask;
                $customerData = $request->customer_data;
            } else {
                // Gerar token no backend (sandbox)
                $paymentData = $request->payment_data;
                $tokenResponse = $this->efiPayService->getPaymentToken([
                    'brand' => $paymentData['card_brand'],
                    'number' => $paymentData['card_number'],
                    'cvv' => $paymentData['card_cvv'],
                    'expiration_month' => $paymentData['card_expiry_month'],
                    'expiration_year' => $paymentData['card_expiry_year'],
                ]);

                if (!isset($tokenResponse['data']['payment_token'])) {
                    throw new \Exception('Erro ao obter token de pagamento');
                }

                $paymentToken = $tokenResponse['data']['payment_token'];
                $cardBrand = $tokenResponse['data']['brand'];
                $cardMask = $tokenResponse['data']['card_mask'];
                $customerData = [
                    'cpf' => $establishment->user->cpf ?? '00000000000',
                    'birth' => '1990-01-01', // Valor padrão para sandbox
                    'phone_number' => $establishment->user->phone ?? '11999999999',
                ];
            }

            // 2. Obter ID do plano existente na Efí Pay
            $planSlug = strtolower($plan->name);
            $efiPlanId = $this->efiPayService->getExistingPlanId($planSlug);
            
            if (!$efiPlanId) {
                throw new \Exception('Plano não encontrado na Efí Pay: ' . $plan->name);
            }

            // 3. ETAPA 1: Criar assinatura (sem pagamento)
            $subscriptionData = [
                'efipay_plan_id' => $efiPlanId,
                'plan_name' => $plan->name,
                'plan_value' => $plan->price * 100, // converter para centavos
                'establishment_id' => $establishment->id,
                'customer_data' => $customerData,
            ];

            $subscriptionResponse = $this->efiPayService->createSubscription($subscriptionData);

            // Verificar estrutura da resposta (pode estar aninhada)
            $responseData = $subscriptionResponse['data']['data'] ?? $subscriptionResponse['data'];
            
            if (!isset($responseData['subscription_id'])) {
                throw new \Exception('Erro ao criar assinatura na Efí Pay');
            }

            $subscriptionId = $responseData['subscription_id'];

            // Adicionar delay para dar tempo de processamento
            sleep(1);

            // 4. ETAPA 2: Processar pagamento usando o charge_id da assinatura
            $chargeId = $responseData['charges'][0]['charge_id'] ?? null;
            
            if (!$chargeId) {
                throw new \Exception('Cobrança não foi criada automaticamente pela assinatura');
            }
            
            $paymentProcessData = [
                'subscription_id' => $subscriptionId,
                'charge_id' => $chargeId,
                'payment_token' => $paymentToken,
                'customer' => [
                    'name' => $establishment->user->name,
                    'email' => $establishment->user->email,
                    'cpf' => $customerData['cpf'],
                    'birth' => $customerData['birth'],
                    'phone_number' => $customerData['phone_number'],
                ],
            ];

            $paymentResponse = $this->efiPayService->processFirstPayment($paymentProcessData);

            // Adicionar delay para processamento do pagamento
            sleep(2);

            // 5. ETAPA 3: Verificar status final baseado na resposta real da Efí Pay
            
            // Para Two Steps: verificar tanto subscription quanto charge status
            $subscriptionStatus = $paymentResponse['data']['status'] ?? $subscriptionResponse['data']['status'] ?? 'unknown';
            $chargeStatus = $paymentResponse['data']['charge']['status'] ?? 'unknown';
            
            // Status válidos baseados na documentação:
            // Subscription: "new", "active", "suspended", "cancelled"  
            // Charge: "new", "waiting", "paid", "unpaid", "refunded", "cancelled"
            
            $isPaymentSuccessful = in_array($chargeStatus, ['waiting', 'paid']) || 
                                 in_array($subscriptionStatus, ['active', 'new']);
            
            if (!$isPaymentSuccessful) {
                $errorReason = $paymentResponse['data']['reason'] ?? 
                             $paymentResponse['data']['charge']['reason'] ?? 
                             'Pagamento não foi processado. Status: ' . $chargeStatus;
                throw new \Exception('Pagamento rejeitado: ' . $errorReason);
            }

            // Determinar status final para o establishment
            $finalStatus = 'active';
            if ($chargeStatus === 'waiting') {
                $finalStatus = 'pending'; // Aguardando confirmação do pagamento
            } else if ($subscriptionStatus === 'active' && $chargeStatus === 'paid') {
                $finalStatus = 'active'; // Totalmente ativo
            } else if ($subscriptionStatus === 'new') {
                $finalStatus = 'pending'; // Recém criado, aguardando
            }

            // 6. Atualizar establishment após confirmação
            $establishment->update([
                'plan_id' => $plan->id,
                'subscription_status' => $finalStatus,
                'efipay_subscription_id' => $subscriptionId,
                'efipay_plan_id' => $efiPlanId,
                'subscription_started_at' => now(),
                'subscription_expires_at' => now()->addMonths(12),
                'subscription_updated_at' => now(),
                'subscription_value' => $plan->price * 100,
                'subscription_plan_name' => $plan->name,
                'subscription_metadata' => [
                    'subscription_response' => $subscriptionResponse,
                    'payment_response' => $paymentResponse,
                    'processing_steps' => [
                        'step1_subscription_created' => now(),
                        'step2_payment_processed' => now(),
                        'step3_confirmed' => now(),
                    ],
                    'status_details' => [
                        'subscription_status' => $subscriptionStatus,
                        'charge_status' => $chargeStatus,
                        'final_status' => $finalStatus,
                    ],
                ],
            ]);

            DB::commit();

            // Determinar mensagem de sucesso baseada no status
            $successMessage = match($finalStatus) {
                'active' => 'Assinatura ativada com sucesso! Pagamento confirmado.',
                'pending' => 'Assinatura criada! Aguardando confirmação do pagamento.',
                default => 'Assinatura processada com sucesso!'
            };

            // Se for uma requisição AJAX, retorna JSON
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $successMessage,
                    'subscription' => [
                        'id' => $subscriptionId,
                        'status' => $finalStatus,
                        'plan_name' => $plan->name,
                        'subscription_status' => $subscriptionStatus,
                        'charge_status' => $chargeStatus,
                    ]
                ]);
            }

            return redirect()->route('subscription.index')
                ->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Categorizar o tipo de erro
            $errorType = $this->categorizePaymentError($e);
            $userMessage = $this->getUserFriendlyErrorMessage($errorType, $e);
            
            Log::error('Subscription Creation Error', [
                'error' => $e->getMessage(),
                'error_type' => $errorType,
                'establishment_id' => $establishment->id,
                'plan_id' => $plan->id,
                'user_message' => $userMessage,
            ]);

            // Se for uma requisição AJAX, retorna JSON
            if (request()->wantsJson()) {
                // Se for erro de validação, capturar as mensagens específicas
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $errors = $e->validator->errors()->all();
                    $message = implode(' ', $errors);
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'error_type' => 'validation_error',
                        'errors' => $e->validator->errors(),
                    ], 422);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => $userMessage,
                    'error_type' => $errorType,
                ], 422);
            }

            return redirect()->back()
                ->with('error', $userMessage);
        }
    }

    /**
     * Cancel subscription
     */
    public function cancel(Request $request)
    {
        $request->validate([
            'cancel_reason' => 'required|string',
            'satisfaction_rating' => 'required|string',
            'recommendation_rating' => 'required|string',
        ], [
            'cancel_reason.required' => 'Motivo do cancelamento é obrigatório.',
            'satisfaction_rating.required' => 'Avaliação de satisfação é obrigatória.',
            'recommendation_rating.required' => 'Avaliação de recomendação é obrigatória.',
        ]);

        $establishment = Auth::user()->establishment;

        if (!$establishment->efipay_subscription_id) {
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhuma assinatura ativa encontrada.',
                ], 422);
            }
            return redirect()->back()
                ->with('error', 'Nenhuma assinatura ativa encontrada.');
        }

        DB::beginTransaction();

        try {
            // Cancelar no Efí Pay
            $this->efiPayService->cancelSubscription($establishment->efipay_subscription_id);

            // Salvar dados do cancelamento
            $cancelData = [
                'cancel_reason' => $request->cancel_reason,
                'satisfaction_rating' => $request->satisfaction_rating,
                'recommendation_rating' => $request->recommendation_rating,
                'cancelled_at' => now(),
            ];

            // Atualizar establishment
            $establishment->update([
                'subscription_status' => 'cancelled',
                'subscription_updated_at' => now(),
                'subscription_metadata' => array_merge(
                    $establishment->subscription_metadata ?? [],
                    ['cancellation' => $cancelData]
                ),
            ]);

            // Log para análise
            Log::info('Subscription Cancelled with Feedback', [
                'establishment_id' => $establishment->id,
                'establishment_name' => $establishment->name,
                'plan_name' => $establishment->plan->name,
                'cancel_reason' => $request->cancel_reason,
                'satisfaction_rating' => $request->satisfaction_rating,
                'recommendation_rating' => $request->recommendation_rating,
            ]);

            DB::commit();

            // Se for uma requisição AJAX, retorna JSON
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Assinatura cancelada com sucesso! Agradecemos pelo seu feedback.',
                    'feedback' => [
                        'reason' => $request->cancel_reason,
                        'satisfaction' => $request->satisfaction_rating,
                        'recommendation' => $request->recommendation_rating,
                    ]
                ]);
            }

            return redirect()->route('subscription.index')
                ->with('success', 'Assinatura cancelada com sucesso! Agradecemos pelo seu feedback.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Subscription Cancellation Error', [
                'error' => $e->getMessage(),
                'establishment_id' => $establishment->id,
                'subscription_id' => $establishment->efipay_subscription_id,
            ]);

            // Se for uma requisição AJAX, retorna JSON
            if (request()->wantsJson()) {
                // Se for erro de validação, capturar as mensagens específicas
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $errors = $e->validator->errors()->all();
                    $message = implode(' ', $errors);
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'error_type' => 'validation_error',
                        'errors' => $e->validator->errors(),
                    ], 422);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao cancelar assinatura: ' . $e->getMessage(),
                ], 422);
            }

            return redirect()->back()
                ->with('error', 'Erro ao cancelar assinatura: ' . $e->getMessage());
        }
    }

    /**
     * Get subscription details
     */
    public function show()
    {
        $establishment = Auth::user()->establishment;

        if (!$establishment->efipay_subscription_id) {
            return response()->json(['error' => 'Nenhuma assinatura encontrada'], 404);
        }

        try {
            $subscriptionDetails = $this->efiPayService->getSubscription($establishment->efipay_subscription_id);

            return response()->json([
                'subscription' => $subscriptionDetails,
                'establishment' => $establishment,
            ]);

        } catch (\Exception $e) {
            Log::error('Get Subscription Error', [
                'error' => $e->getMessage(),
                'establishment_id' => $establishment->id,
                'subscription_id' => $establishment->efipay_subscription_id,
            ]);

            return response()->json(['error' => 'Erro ao obter detalhes da assinatura'], 500);
        }
    }


    /**
     * Handle webhook from Efí Pay
     */
    public function webhook(Request $request)
    {
        Log::info('EfiPay Webhook Received', $request->all());

        try {
            $this->efiPayService->processWebhook($request->all());

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('Webhook Processing Error', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle webhook from Mercado Pago
     */
    public function mercadopagoWebhook(Request $request)
    {
        Log::info('MercadoPago Webhook Received', $request->all());

        try {
            $result = $this->mercadoPagoService->processWebhook($request->all());

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('MercadoPago Webhook Processing Error', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return response()->json(['status' => 'error', 'message' => 'Webhook processing failed'], 500);
        }
    }
    
    /**
     * Categorizar tipo de erro de pagamento
     */
    private function categorizePaymentError(\Exception $e): string
    {
        $message = strtolower($e->getMessage());
        
        // Cartão rejeitado
        if (str_contains($message, 'card') && (str_contains($message, 'reject') || str_contains($message, 'denied'))) {
            return 'card_rejected';
        }
        
        // Cartão inválido
        if (str_contains($message, 'invalid') && str_contains($message, 'card')) {
            return 'invalid_card';
        }
        
        // Saldo insuficiente
        if (str_contains($message, 'insufficient') || str_contains($message, 'limit')) {
            return 'insufficient_funds';
        }
        
        // Cartão expirado
        if (str_contains($message, 'expired')) {
            return 'expired_card';
        }
        
        // Erro de conexão
        if (str_contains($message, 'connection') || str_contains($message, 'timeout')) {
            return 'connection_error';
        }
        
        // Outros erros
        return 'general_error';
    }
    
    /**
     * Obter mensagem amigável para o usuário
     */
    private function getUserFriendlyErrorMessage(string $errorType, \Exception $e): string
    {
        switch ($errorType) {
            case 'card_rejected':
                return '💳 Cartão rejeitado pela operadora. Verifique se os dados estão corretos ou tente outro cartão.';
                
            case 'invalid_card':
                return '⚠️ Dados do cartão inválidos. Verifique o número, CVV, validade e nome no cartão.';
                
            case 'insufficient_funds':
                return '💰 Saldo insuficiente ou limite ultrapassado. Verifique o limite disponível do cartão.';
                
            case 'expired_card':
                return '📅 Cartão expirado. Utilize um cartão válido para continuar.';
                
            case 'connection_error':
                return '🌐 Erro de conexão temporário. Tente novamente em alguns minutos.';
                
            default:
                return '❌ Erro ao processar pagamento. Tente novamente ou entre em contato com o suporte.';
        }
    }
}