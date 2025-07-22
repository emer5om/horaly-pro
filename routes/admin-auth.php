<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Rotas de Autenticação - Admin
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest')->group(function () {
        // Login do admin
        Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('login');
        Route::post('/login', [AdminAuthController::class, 'login']);
    });
    
    // Logout do admin
    Route::post('/logout', [AdminAuthController::class, 'logout'])
        ->middleware('auth')
        ->name('logout');
});

/*
|--------------------------------------------------------------------------
| Rotas Protegidas - Admin
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard do admin
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    // Gestão de estabelecimentos
    Route::resource('establishments', App\Http\Controllers\Admin\EstablishmentsController::class);
    Route::patch('/establishments/{establishment}/toggle-block', [App\Http\Controllers\Admin\EstablishmentsController::class, 'toggleBlock'])->name('establishments.toggle-block');
    Route::patch('/establishments/{establishment}/change-plan', [App\Http\Controllers\Admin\EstablishmentsController::class, 'changePlan'])->name('establishments.change-plan');
    
    // Gestão de planos
    Route::resource('plans', App\Http\Controllers\Admin\PlansController::class);
    Route::patch('/plans/{plan}/toggle-status', [App\Http\Controllers\Admin\PlansController::class, 'toggleStatus'])->name('plans.toggle-status');
    Route::get('/plans/{plan}/permissions', [App\Http\Controllers\Admin\PlansController::class, 'permissions'])->name('plans.permissions');
    Route::put('/plans/{plan}/permissions', [App\Http\Controllers\Admin\PlansController::class, 'updatePermissions'])->name('plans.permissions.update');
    
    // Suporte
    Route::get('/support', function () {
        return Inertia::render('admin/support/index');
    })->name('support.index');
    
    // Landing Page
    Route::get('/landing-page', [App\Http\Controllers\Admin\LandingPageController::class, 'index'])->name('landing-page.index');
    Route::put('/landing-page', [App\Http\Controllers\Admin\LandingPageController::class, 'update'])->name('landing-page.update');
    Route::put('/landing-page/plans-visibility', [App\Http\Controllers\Admin\LandingPageController::class, 'updatePlansVisibility'])->name('landing-page.plans-visibility');
    Route::put('/landing-page/plans/{plan}', [App\Http\Controllers\Admin\LandingPageController::class, 'updatePlan'])->name('landing-page.plans.update');
    Route::put('/landing-page/plans-order', [App\Http\Controllers\Admin\LandingPageController::class, 'updatePlansOrder'])->name('landing-page.plans-order');
    
    // Transações de Assinaturas
    Route::get('/transactions', [App\Http\Controllers\Admin\TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/{transaction}', [App\Http\Controllers\Admin\TransactionController::class, 'show'])->name('transactions.show');
    Route::put('/transactions/{transaction}', [App\Http\Controllers\Admin\TransactionController::class, 'update'])->name('transactions.update');
    Route::get('/transactions-export', [App\Http\Controllers\Admin\TransactionController::class, 'export'])->name('transactions.export');
});