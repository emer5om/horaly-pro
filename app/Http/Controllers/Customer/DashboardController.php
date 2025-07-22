<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CustomerFavoriteService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Exibe o dashboard do cliente
     */
    public function index(): Response
    {
        $customer = Auth::guard('customer')->user();

        // Próximos agendamentos
        $upcomingAppointments = Appointment::with(['service', 'establishment'])
            ->where('customer_id', $customer->id)
            ->whereIn('status', ['confirmed', 'pending'])
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->take(3)
            ->get();

        // Último agendamento
        $lastAppointment = Appointment::with(['service', 'establishment'])
            ->where('customer_id', $customer->id)
            ->where('status', 'completed')
            ->orderBy('scheduled_at', 'desc')
            ->first();

        // Estatísticas
        $stats = [
            'total_appointments' => Appointment::where('customer_id', $customer->id)->count(),
            'completed_appointments' => Appointment::where('customer_id', $customer->id)->where('status', 'completed')->count(),
            'pending_appointments' => Appointment::where('customer_id', $customer->id)->where('status', 'pending')->count(),
            'favorite_services_count' => CustomerFavoriteService::where('customer_id', $customer->id)->count(),
        ];

        // Serviços favoritos
        $favoriteServices = CustomerFavoriteService::with(['service.establishment'])
            ->where('customer_id', $customer->id)
            ->take(3)
            ->get();

        return Inertia::render('customer/Dashboard', [
            'customer' => $customer,
            'upcomingAppointments' => $upcomingAppointments,
            'lastAppointment' => $lastAppointment,
            'stats' => $stats,
            'favoriteServices' => $favoriteServices,
        ]);
    }
}