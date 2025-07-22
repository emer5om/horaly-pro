<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Exibe o formulário de login do cliente
     */
    public function showLoginForm(): Response
    {
        return Inertia::render('customer/auth/Login');
    }

    /**
     * Processa o login do cliente (apenas com telefone)
     */
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        // Normalizar o telefone (remover espaços, parênteses, etc)
        $phoneNormalized = preg_replace('/[^0-9]/', '', $request->phone);

        // Buscar cliente pelo telefone de várias formas
        $customer = Customer::where(function($query) use ($request, $phoneNormalized) {
            $query->where('phone', $request->phone)
                  ->orWhere('phone', $phoneNormalized);
            
            // Buscar também comparando apenas os números
            $query->orWhereRaw('REGEXP_REPLACE(phone, "[^0-9]", "") = ?', [$phoneNormalized]);
        })->first();

        if (!$customer) {
            return back()->withErrors([
                'phone' => 'Telefone não encontrado. Verifique se você já possui agendamentos conosco.',
            ]);
        }

        if ($customer->is_blocked) {
            return back()->withErrors([
                'phone' => 'Sua conta está bloqueada. Entre em contato com o estabelecimento.',
            ]);
        }

        // Fazer login do cliente
        Auth::guard('customer')->login($customer, $request->boolean('remember'));

        return redirect()->intended(route('customer.dashboard'));
    }

    /**
     * Logout do cliente
     */
    public function logout(Request $request)
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('customer.login');
    }
}