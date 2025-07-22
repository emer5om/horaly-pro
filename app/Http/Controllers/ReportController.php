<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        if (!$establishment) {
            return redirect()->route('dashboard')->with('error', 'Estabelecimento não encontrado.');
        }
        
        // Período padrão: últimos 30 dias
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        
        // Estatísticas gerais
        $totalAppointments = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->count();
            
        $completedAppointments = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->count();
            
        $cancelledAppointments = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->where('status', 'cancelled')
            ->count();
            
        $totalRevenue = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->with('service')
            ->get()
            ->sum(function ($appointment) {
                return $appointment->service ? $appointment->service->price : 0;
            });
            
        $newCustomers = Customer::where('establishment_id', $establishment->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
        
        // Serviços mais agendados
        $topServices = Service::where('establishment_id', $establishment->id)
            ->withCount(['appointments' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('scheduled_at', [$startDate, $endDate]);
            }])
            ->orderBy('appointments_count', 'desc')
            ->limit(10)
            ->get();
        
        // Agendamentos por dia
        $appointmentsByDay = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->selectRaw('DATE(scheduled_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
        
        return Inertia::render('establishment/reports/Index', [
            'stats' => [
                'total_appointments' => $totalAppointments,
                'completed_appointments' => $completedAppointments,
                'cancelled_appointments' => $cancelledAppointments,
                'total_revenue' => $totalRevenue,
                'new_customers' => $newCustomers,
                'completion_rate' => $totalAppointments > 0 ? round(($completedAppointments / $totalAppointments) * 100, 1) : 0,
            ],
            'topServices' => $topServices,
            'appointmentsByDay' => $appointmentsByDay,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}