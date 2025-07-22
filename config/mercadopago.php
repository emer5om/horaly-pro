<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mercado Pago Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Mercado Pago integration for establishment subscriptions
    |
    */

    'environment' => env('MERCADOPAGO_ENVIRONMENT', 'sandbox'), // 'sandbox' or 'production'
    
    'access_token' => env('MERCADOPAGO_ENVIRONMENT', 'sandbox') === 'production' 
        ? env('MERCADOPAGO_ACCESS_TOKEN_PROD')
        : env('MERCADOPAGO_ACCESS_TOKEN_SANDBOX'),
    
    'public_key' => env('MERCADOPAGO_ENVIRONMENT', 'sandbox') === 'production'
        ? env('MERCADOPAGO_PUBLIC_KEY_PROD') 
        : env('MERCADOPAGO_PUBLIC_KEY_SANDBOX'),
    
    'webhook_url' => env('MERCADOPAGO_WEBHOOK_URL', env('APP_URL') . '/api/webhooks/mercadopago'),
    
    'currency' => 'BRL',
    
    'payment_methods' => [
        'pix' => [
            'enabled' => true,
            'expiration_minutes' => 30, // PIX expira em 30 minutos
        ]
    ],
    
    'notifications' => [
        'email' => env('MAIL_FROM_ADDRESS', 'admin@horaly.com'),
        'enabled' => true,
    ],
    
    'debug' => env('APP_DEBUG', false),
    
];