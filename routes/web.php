<?php

use App\Http\Controllers\EstablishmentDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Rotas Públicas
|--------------------------------------------------------------------------
*/

// Página inicial - pode ser landing page ou redirect para login
Route::get('/', function () {
    $plans = \App\Models\Plan::forLanding()->get();
    $settings = [];
    
    $defaultSettings = \App\Models\LandingPageSettings::getDefault();
    foreach ($defaultSettings as $key => $defaultValue) {
        $settings[$key] = \App\Models\LandingPageSettings::get($key, $defaultValue);
    }
    
    return Inertia::render('welcome', [
        'plans' => $plans,
        'settings' => $settings,
    ]);
})->name('home');

// Página pública de agendamento - será movida para o final do arquivo

// API routes for public booking
Route::get('/api/available-times', [App\Http\Controllers\BookingController::class, 'getAvailableTimes'])->name('booking.available-times');
Route::get('/api/day-availability', [App\Http\Controllers\BookingController::class, 'getDayAvailability'])->name('booking.day-availability');
Route::get('/api/booking/{slug}/customers/search', [App\Http\Controllers\BookingController::class, 'searchCustomer'])->name('booking.search-customer');
Route::get('/api/booking/customers/search', [App\Http\Controllers\BookingController::class, 'searchCustomer'])->name('booking.search-customer-global');
Route::post('/api/booking/validate-coupon', [App\Http\Controllers\BookingController::class, 'validateCoupon'])->name('booking.validate-coupon');
// Moved to api.php

// WhatsApp Webhook (public route)
Route::post('/webhooks/whatsapp', [App\Http\Controllers\WhatsAppController::class, 'webhook'])->name('whatsapp.webhook');

// Webhooks movidos para routes/api.php (sem verificação CSRF)


/*
|--------------------------------------------------------------------------
| Rotas de Autenticação - Estabelecimentos
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    // Login do estabelecimento
    Route::get('/login', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store']);
    
    // Registro do estabelecimento
    Route::get('/register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'store']);
});

// Logout do estabelecimento
Route::post('/logout', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| Rotas Protegidas - Estabelecimentos
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:establishment', 'subscription'])->group(function () {
    // Dashboard do estabelecimento
    Route::get('/dashboard', [EstablishmentDashboardController::class, 'index'])->name('dashboard');
    
    // Onboarding do estabelecimento
    Route::post('/establishment/onboarding', [EstablishmentDashboardController::class, 'storeOnboarding'])->name('establishment.onboarding.store');
    
    // Serviços
    Route::resource('services', App\Http\Controllers\ServiceController::class);
    Route::patch('/services/{service}/toggle', [App\Http\Controllers\ServiceController::class, 'toggle'])->name('services.toggle');
    
    // Clientes
    Route::resource('customers', App\Http\Controllers\CustomerController::class);
    
    // Agendamentos
    Route::resource('appointments', App\Http\Controllers\AppointmentController::class);
    Route::get('/agenda', [App\Http\Controllers\AppointmentController::class, 'agenda'])->name('appointments.agenda');
    Route::patch('/appointments/{appointment}/status', [App\Http\Controllers\AppointmentController::class, 'updateStatus'])->name('appointments.update-status');
    Route::post('/appointments/{appointment}/start-timer', [App\Http\Controllers\AppointmentController::class, 'startTimer'])->name('appointments.start-timer');
    Route::post('/appointments/{appointment}/complete', [App\Http\Controllers\AppointmentController::class, 'completeService'])->name('appointments.complete');
    
    // API routes for AJAX calls
    Route::get('/api/customers/search', [App\Http\Controllers\CustomerController::class, 'search'])->name('customers.search');
    
    // Notificações API - return JSON responses
    Route::get('/api/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('api.notifications.index');
    Route::patch('/api/notifications/{notification}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::patch('/api/notifications/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    
    // Relatórios
    Route::get('/reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
    
    // Minha Empresa
    Route::get('/company', [App\Http\Controllers\CompanyController::class, 'index'])->name('company.index');
    Route::patch('/company/data', [App\Http\Controllers\CompanyController::class, 'updateCompanyData'])->name('company.data');
    

    // Pagamentos
    Route::get('/payments', [App\Http\Controllers\PaymentsController::class, 'index'])->name('payments.index');

    // Marketing & Analytics
    Route::get('/integrations', [App\Http\Controllers\Establishment\IntegrationsController::class, 'index'])->name('integrations.index');
    Route::patch('/establishment/integrations/analytics', [App\Http\Controllers\Establishment\IntegrationsController::class, 'updateAnalytics'])->name('integrations.analytics');

    // Notificações e Lembretes
    Route::get('/notifications', [App\Http\Controllers\Establishment\NotificationsController::class, 'index'])->name('notifications.index');
    Route::get('/reminders', function () {
        return redirect()->route('notifications.index');
    })->name('reminders.index');
    Route::post('/establishment/integrations/whatsapp/connect', [App\Http\Controllers\Establishment\NotificationsController::class, 'connectWhatsapp'])->name('notifications.whatsapp.connect');
    Route::get('/establishment/integrations/whatsapp/status', [App\Http\Controllers\Establishment\NotificationsController::class, 'whatsappStatus'])->name('notifications.whatsapp.status');
    Route::patch('/establishment/integrations/whatsapp', [App\Http\Controllers\Establishment\NotificationsController::class, 'updateWhatsapp'])->name('notifications.whatsapp.update');
    Route::post('/establishment/integrations/whatsapp/disconnect', [App\Http\Controllers\Establishment\NotificationsController::class, 'disconnectWhatsapp'])->name('notifications.whatsapp.disconnect');
    Route::post('/whatsapp/simulate-connection', [App\Http\Controllers\Establishment\NotificationsController::class, 'simulateConnection'])->name('whatsapp.simulate-connection');
    Route::patch('/establishment/notifications/messages', [App\Http\Controllers\Establishment\NotificationsController::class, 'updateMessages'])->name('notifications.messages');
    Route::patch('/establishment/notifications/settings', [App\Http\Controllers\Establishment\NotificationsController::class, 'updateSettings'])->name('notifications.settings');
    
    // Campanhas
    Route::post('/establishment/campaigns', [App\Http\Controllers\Establishment\NotificationsController::class, 'createCampaign'])->name('campaigns.create');
    Route::post('/establishment/campaigns/{campaign}/start', [App\Http\Controllers\Establishment\NotificationsController::class, 'startCampaign'])->name('campaigns.start');
    Route::post('/establishment/campaigns/{campaign}/pause', [App\Http\Controllers\Establishment\NotificationsController::class, 'pauseCampaign'])->name('campaigns.pause');
    Route::delete('/establishment/campaigns/{campaign}', [App\Http\Controllers\Establishment\NotificationsController::class, 'deleteCampaign'])->name('campaigns.delete');
    Route::get('/establishment/clients', [App\Http\Controllers\Establishment\NotificationsController::class, 'getClients'])->name('clients.index');
    Route::patch('/company/working-hours', [App\Http\Controllers\CompanyController::class, 'updateWorkingHours'])->name('company.working-hours');
    Route::patch('/company/booking-settings', [App\Http\Controllers\CompanyController::class, 'updateBookingSettings'])->name('company.booking-settings');
    Route::post('/company/blocked-dates', [App\Http\Controllers\CompanyController::class, 'storeBlockedDate'])->name('company.blocked-dates.store');
    Route::delete('/company/blocked-dates/{blockedDate}', [App\Http\Controllers\CompanyController::class, 'destroyBlockedDate'])->name('company.blocked-dates.destroy');
    Route::post('/company/blocked-times', [App\Http\Controllers\CompanyController::class, 'storeBlockedTime'])->name('company.blocked-times.store');
    Route::delete('/company/blocked-times/{blockedTime}', [App\Http\Controllers\CompanyController::class, 'destroyBlockedTime'])->name('company.blocked-times.destroy');
    Route::post('/company/coupons', [App\Http\Controllers\CompanyController::class, 'storeCoupon'])->name('company.coupons.store');
    Route::patch('/company/coupons/{coupon}', [App\Http\Controllers\CompanyController::class, 'updateCoupon'])->name('company.coupons.update');
    Route::delete('/company/coupons/{coupon}', [App\Http\Controllers\CompanyController::class, 'destroyCoupon'])->name('company.coupons.destroy');
    Route::patch('/company/notifications', [App\Http\Controllers\CompanyController::class, 'updateNotificationSettings'])->name('company.notifications');
    Route::patch('/company/trust-lists', [App\Http\Controllers\CompanyController::class, 'updateTrustLists'])->name('company.trust-lists');
    
    // Configurações do estabelecimento
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [App\Http\Controllers\EstablishmentSettingsController::class, 'index'])->name('index');
        Route::put('/general', [App\Http\Controllers\EstablishmentSettingsController::class, 'updateGeneral'])->name('general');
        Route::put('/appearance', [App\Http\Controllers\EstablishmentSettingsController::class, 'updateAppearance'])->name('appearance');
        Route::put('/working-hours', [App\Http\Controllers\EstablishmentSettingsController::class, 'updateWorkingHours'])->name('working-hours');
        Route::put('/booking', [App\Http\Controllers\EstablishmentSettingsController::class, 'updateBookingSettings'])->name('booking');
        Route::put('/payment', [App\Http\Controllers\EstablishmentSettingsController::class, 'updatePaymentSettings'])->name('payment');
        Route::put('/integrations', [App\Http\Controllers\EstablishmentSettingsController::class, 'updateIntegrations'])->name('integrations');
        Route::post('/check-slug', [App\Http\Controllers\EstablishmentSettingsController::class, 'checkSlugAvailability'])->name('check-slug');
    });
    
    
    // WhatsApp Integration Routes
    Route::prefix('whatsapp')->name('whatsapp.')->group(function () {
        Route::post('/create-instance', [App\Http\Controllers\WhatsAppController::class, 'createInstance'])->name('create-instance');
        Route::post('/connect', [App\Http\Controllers\WhatsAppController::class, 'connect'])->name('connect');
        Route::get('/status', [App\Http\Controllers\WhatsAppController::class, 'status'])->name('status');
        Route::post('/disconnect', [App\Http\Controllers\WhatsAppController::class, 'disconnect'])->name('disconnect');
        Route::delete('/delete', [App\Http\Controllers\WhatsAppController::class, 'delete'])->name('delete');
        Route::post('/send-test', [App\Http\Controllers\WhatsAppController::class, 'sendTestMessage'])->name('send-test');
        Route::patch('/notification-settings', [App\Http\Controllers\WhatsAppController::class, 'updateNotificationSettings'])->name('notification-settings');
    });
    
    // Subscription routes
    Route::prefix('subscription')->name('subscription.')->group(function () {
        Route::get('/', [App\Http\Controllers\SubscriptionController::class, 'index'])->name('index');
        Route::post('/create', [App\Http\Controllers\SubscriptionController::class, 'create'])->name('create');
        Route::post('/cancel', [App\Http\Controllers\SubscriptionController::class, 'cancel'])->name('cancel');
        Route::get('/details', [App\Http\Controllers\SubscriptionController::class, 'show'])->name('show');
        
        // PIX payment routes for plan subscriptions (Mercado Pago)
        Route::post('/pix', [App\Http\Controllers\SubscriptionController::class, 'createPixPayment'])->name('pix.create');
        Route::get('/pix/{paymentId}/status', [App\Http\Controllers\SubscriptionController::class, 'checkPixPaymentStatus'])->name('pix.status');
    });
    
    // Outras rotas do estabelecimento serão adicionadas aqui
});

/*
|--------------------------------------------------------------------------
| Rotas de Configurações
|--------------------------------------------------------------------------
*/

require __DIR__.'/admin-auth.php';
require __DIR__.'/settings.php';
require __DIR__.'/customer.php';

/*
|--------------------------------------------------------------------------
| Rotas de Booking Público - DEVE SER A ÚLTIMA ROTA
|--------------------------------------------------------------------------
*/

// Página pública de agendamento - usar slug direto do estabelecimento
// IMPORTANTE: Esta rota deve ser a última para não conflitar com outras rotas
Route::get('/{slug}', [App\Http\Controllers\BookingController::class, 'show'])->name('booking.show');
Route::post('/{slug}', [App\Http\Controllers\BookingController::class, 'store'])->name('booking.store');
Route::prefix('api/booking-payment')->group(function () {
    Route::get('fee-info/{appointment}', [App\Http\Controllers\BookingPaymentController::class, 'getBookingFeeInfo']);
    Route::post('pix', [App\Http\Controllers\BookingPaymentController::class, 'createPixPayment']);
    Route::get('status/{transaction}', [App\Http\Controllers\BookingPaymentController::class, 'checkPaymentStatus']);
    Route::get('payment-methods', [App\Http\Controllers\BookingPaymentController::class, 'getPaymentMethods']);
});

Route::post('/api/validate-mercadopago-token', [App\Http\Controllers\EstablishmentSettingsController::class, 'validateMercadoPagoToken']);
