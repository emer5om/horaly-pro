<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Establishment;
use App\Models\Plan;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Exibe o dashboard do admin
     */
    public function index(): Response
    {
        // Estatísticas gerais do sistema
        $stats = [
            // Estabelecimentos
            'total_establishments' => Establishment::count(),
            'active_establishments' => Establishment::where('status', 'active')->count(),
            'inactive_establishments' => Establishment::where('status', 'inactive')->count(),
            
            // Usuários
            'total_users' => User::count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'total_establishment_users' => User::where('role', 'establishment')->count(),
            'total_customers' => Customer::count(),
            
            // Agendamentos
            'total_appointments' => Appointment::count(),
            'pending_appointments' => Appointment::where('status', 'pending')->count(),
            'confirmed_appointments' => Appointment::where('status', 'confirmed')->count(),
            'completed_appointments' => Appointment::where('status', 'completed')->count(),
            'cancelled_appointments' => Appointment::where('status', 'cancelled')->count(),
            
            // Serviços
            'total_services' => Service::count(),
            'active_services' => Service::where('is_active', true)->count(),
            
            // Planos
            'total_plans' => Plan::count(),
            'active_plans' => Plan::where('is_active', true)->count(),
        ];

        // Receita total (agendamentos completados)
        $totalRevenue = Appointment::where('status', 'completed')
            ->sum('price') ?? 0;

        // MRR - Monthly Recurring Revenue (estimativa baseada nos planos)
        $mrr = Establishment::join('plans', 'establishments.plan_id', '=', 'plans.id')
            ->where('establishments.status', 'active')
            ->sum('plans.price') ?? 0;

        // Estabelecimentos mais recentes
        $recentEstablishments = Establishment::with(['user', 'plan'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Agendamentos recentes
        $recentAppointments = Appointment::with(['establishment', 'customer', 'service'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'totalRevenue' => $totalRevenue,
            'mrr' => $mrr,
            'recentEstablishments' => $recentEstablishments,
            'recentAppointments' => $recentAppointments,
        ]);
    }
}
