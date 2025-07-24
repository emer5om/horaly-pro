<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Webhooks (sem CSRF protection)
Route::post('/webhooks/mercadopago', [App\Http\Controllers\SubscriptionController::class, 'mercadopagoWebhook'])->name('api.mercadopago.webhook');
Route::post('/webhooks/efipay', [App\Http\Controllers\SubscriptionController::class, 'webhook'])->name('api.efipay.webhook');

// Public booking API
Route::post('/appointments', [App\Http\Controllers\BookingController::class, 'createAppointment'])->name('api.booking.create-appointment');

// Notifications moved back to web.php

