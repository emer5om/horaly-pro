<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    /**
     * Exibe a página de login do admin
     */
    public function showLogin(): Response
    {
        return Inertia::render('admin/login');
    }

    /**
     * Processa o login do admin
     */
    public function login(Request $request): RedirectResponse
    {
        // Valida os dados do formulário
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'O campo e-mail é obrigatório.',
            'email.email' => 'O e-mail deve ser um endereço válido.',
            'password.required' => 'O campo senha é obrigatório.',
        ]);

        $credentials = $request->only('email', 'password');

        // Verifica se o usuário existe e tem o papel correto
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'As credenciais fornecidas não coincidem com nossos registros.',
            ]);
        }

        // Verifica se é um admin
        if ($user->role !== 'admin') {
            throw ValidationException::withMessages([
                'email' => 'Este usuário não tem permissão para acessar esta área.',
            ]);
        }

        // Faz o login
        Auth::login($user, $request->boolean('remember'));

        // Regenera a sessão para segurança
        $request->session()->regenerate();

        // Redireciona para o dashboard do admin
        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Faz logout do admin
     */
    public function logout(): RedirectResponse
    {
        Auth::logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
