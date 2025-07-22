<?php

use App\Http\Controllers\Customer\AuthController;
use App\Http\Controllers\Customer\DashboardController;
use App\Http\Controllers\Customer\AppointmentController;
use Illuminate\Support\Facades\Route;

// Rotas de autenticação do cliente
Route::middleware('guest:customer')->group(function () {
    Route::get('/customer/login', [AuthController::class, 'showLoginForm'])->name('customer.login');
    Route::post('/customer/login', [AuthController::class, 'login']);
});

// Rotas autenticadas do cliente
Route::middleware('auth:customer')->prefix('customer')->name('customer.')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Agendamentos
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
    Route::post('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule'])->name('appointments.reschedule');
    Route::post('/appointments/{appointment}/repeat', [AppointmentController::class, 'repeat'])->name('appointments.repeat');
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    
    
    // Favoritos
    Route::post('/services/{service}/favorite', [AppointmentController::class, 'toggleFavorite'])->name('services.favorite');
    Route::get('/favorites', [AppointmentController::class, 'favorites'])->name('favorites');
});