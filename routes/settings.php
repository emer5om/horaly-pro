<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\BookingLinkController;
use App\Http\Controllers\Settings\AccountController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // Configurações do Estabelecimento
    Route::middleware(['role:establishment'])->group(function () {
        Route::get('settings/booking-link', [BookingLinkController::class, 'index'])->name('settings.booking-link');
        Route::patch('settings/booking-link', [BookingLinkController::class, 'update'])->name('settings.booking-link.update');
        Route::post('settings/booking-link/logo', [BookingLinkController::class, 'uploadLogo'])->name('settings.booking-link.logo');
        Route::post('settings/booking-link/banner', [BookingLinkController::class, 'uploadBanner'])->name('settings.booking-link.banner');
        
        Route::get('settings/account', [AccountController::class, 'index'])->name('settings.account');
        Route::patch('settings/account/email', [AccountController::class, 'updateEmail'])->name('settings.account.email');
        Route::patch('settings/account/password', [AccountController::class, 'updatePassword'])->name('settings.account.password');
    });
});
