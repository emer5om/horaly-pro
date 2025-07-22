<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Verifica se o usuário está autenticado
        if (!$request->user()) {
            return redirect()->route('login');
        }

        // Verifica se o usuário tem o papel necessário
        if ($request->user()->role !== $role) {
            // Redireciona para a página apropriada baseada no papel do usuário
            return match ($request->user()->role) {
                'admin' => redirect()->route('admin.dashboard'),
                'establishment' => redirect()->route('dashboard'),
                default => redirect()->route('login'),
            };
        }

        return $next($request);
    }
}
