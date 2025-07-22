<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Efí Pay Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Efí Pay (formerly Gerencianet) integration
    |
    */

    'environment' => env('EFIPAY_ENVIRONMENT', 'homolog'), // 'homolog' or 'production'
    
    'client_id' => env('EFIPAY_CLIENT_ID'),
    'client_secret' => env('EFIPAY_CLIENT_SECRET'),
    
    'certificate_path' => env('EFIPAY_CERTIFICATE_PATH', base_path('certificate-homolog.pem')),
    'certificate_path_prod' => env('EFIPAY_CERTIFICATE_PATH_PROD', base_path('certificate-prod.pem')),
    
    'sandbox' => env('EFIPAY_SANDBOX', true),
    
    'urls' => [
        'homolog' => 'https://cobrancas-h.api.efipay.com.br',
        'production' => 'https://cobrancas.api.efipay.com.br',
    ],
    
    'webhook_url' => env('EFIPAY_WEBHOOK_URL', env('APP_URL') . '/webhook/efipay'),
    
    'timeout' => env('EFIPAY_TIMEOUT', 30),
    
    'retry_attempts' => env('EFIPAY_RETRY_ATTEMPTS', 3),
    
    'subscription' => [
        'default_cycles' => 12, // 12 meses
        'trial_days' => 7, // 7 dias de teste
        'grace_period_days' => 3, // 3 dias de carência após vencimento
    ],
    
    // Planos existentes na Efí Pay (IDs reais dos planos já criados)
    'existing_plans' => [
        'starter' => [
            'efipay_plan_id' => env('EFIPAY_PLAN_STARTER_ID', 'plan_sandbox_starter'), // ID real do plano na Efí
            'name' => 'Starter',
            'value' => 3990, // R$ 39,90 em centavos
        ],
        'professional' => [
            'efipay_plan_id' => env('EFIPAY_PLAN_PROFESSIONAL_ID', 'plan_sandbox_professional'), // ID real do plano na Efí
            'name' => 'Professional', 
            'value' => 4990, // R$ 49,90 em centavos
        ],
        'enterprise' => [
            'efipay_plan_id' => env('EFIPAY_PLAN_ENTERPRISE_ID', 'plan_sandbox_enterprise'), // ID real do plano na Efí
            'name' => 'Enterprise',
            'value' => 7990, // R$ 149,90 em centavos
        ],
    ],
    
    // Configuração para criação de planos (se necessário)
    'plan_defaults' => [
        'cycles' => 12,
        'interval' => 1,
        'repeats' => 1,
    ],
    
    'notification' => [
        'email' => env('EFIPAY_NOTIFICATION_EMAIL', 'admin@horaly.com'),
        'phone' => env('EFIPAY_NOTIFICATION_PHONE', '11999999999'),
    ],
    
    'debug' => env('EFIPAY_DEBUG', false),
    
];