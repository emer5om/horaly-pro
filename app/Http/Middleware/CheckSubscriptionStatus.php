<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip verification for specific routes
        $allowedRoutes = [
            'subscription.index',
            'subscription.create',
            'subscription.cancel',
            'subscription.show',
            'subscription.pix.create',
            'subscription.pix.status',
            'logout',
            'settings.index',
            'settings.account',
            'dashboard', // Allow dashboard access to show subscription status
        ];

        if (in_array($request->route()->getName(), $allowedRoutes)) {
            return $next($request);
        }

        // Check if user is authenticated and has an establishment
        if (!Auth::check() || !Auth::user()->establishment) {
            return $next($request);
        }

        $establishment = Auth::user()->establishment;

        // Check if establishment can use the platform
        if (!$establishment->canUse()) {
            // Permitir acesso limitado se estiver em overdue
            if ($establishment->subscription_status === 'overdue') {
                // Para status overdue, permitir acesso apenas a rotas específicas
                $limitedRoutes = [
                    'subscription.index',
                    'subscription.create', 
                    'subscription.cancel',
                    'subscription.show',
                    'dashboard',
                    'logout',
                    'settings.index',
                    'api.notifications.index',
                    'notifications.mark-read',
                    'notifications.mark-all-read'
                ];
                
                if (!in_array($request->route()->getName(), $limitedRoutes)) {
                    // Sempre redirecionar para requisições Inertia/web
                    return redirect()->route('subscription.index', ['from_error' => '1'])
                        ->with('error', 'Seu pagamento foi rejeitado. Atualize seus dados de pagamento para reativar o acesso completo.');
                }
            } else {
                // Para outros status, sempre redirecionar
                return redirect()->route('subscription.index', ['from_error' => '1'])
                    ->with('error', 'Seu período de teste expirou. Escolha um plano para continuar.');
            }
        }

        return $next($request);
    }
}