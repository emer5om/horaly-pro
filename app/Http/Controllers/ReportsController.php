<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $establishment = auth()->user()->establishment;
        $period = $request->get('period', 'month'); // day, week, month, year
        
        $startDate = $this->getStartDate($period);
        $endDate = now();

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
            ->sum('price');

        // Clientes novos no período
        $newCustomers = Customer::where('establishment_id', $establishment->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Agendamentos por dia (últimos 30 dias)
        $appointmentsByDay = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [now()->subDays(30), now()])
            ->select(DB::raw('DATE(scheduled_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('DATE(scheduled_at)'))
            ->orderBy('date')
            ->get();

        // Serviços mais populares
        $topServices = Service::select('services.name', 'services.price', DB::raw('COUNT(appointments.id) as appointments_count'))
            ->where('services.establishment_id', $establishment->id)
            ->leftJoin('appointments', function($join) use ($establishment) {
                $join->on('services.id', '=', 'appointments.service_id')
                     ->where('appointments.establishment_id', '=', $establishment->id);
            })
            ->whereBetween('appointments.scheduled_at', [$startDate, $endDate])
            ->groupBy('services.id', 'services.name', 'services.price')
            ->orderBy('appointments_count', 'desc')
            ->limit(5)
            ->get();

        // Horários com mais agendamentos
        $busyHours = Appointment::where('establishment_id', $establishment->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->select(DB::raw('HOUR(scheduled_at) as hour'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('HOUR(scheduled_at)'))
            ->orderBy('count', 'desc')
            ->get();

        // Taxa de cancelamento
        $cancellationRate = $totalAppointments > 0 ? ($cancelledAppointments / $totalAppointments) * 100 : 0;

        // Receita média por agendamento
        $avgRevenue = $completedAppointments > 0 ? $totalRevenue / $completedAppointments : 0;

        return Inertia::render('establishment/reports/Index', [
            'stats' => [
                'total_appointments' => $totalAppointments,
                'completed_appointments' => $completedAppointments,
                'cancelled_appointments' => $cancelledAppointments,
                'total_revenue' => $totalRevenue,
                'new_customers' => $newCustomers,
                'cancellation_rate' => $cancellationRate,
                'avg_revenue' => $avgRevenue,
            ],
            'charts' => [
                'appointments_by_day' => $appointmentsByDay,
                'top_services' => $topServices,
                'busy_hours' => $busyHours,
            ],
            'period' => $period,
            'date_range' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    private function getStartDate($period)
    {
        switch ($period) {
            case 'day':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfMonth();
        }
    }
}