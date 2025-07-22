<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Establishment;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class EstablishmentDashboardController extends Controller
{
    /**
     * Exibe o dashboard do estabelecimento
     */
    public function index(Request $request): Response|RedirectResponse
    {
        // Busca o estabelecimento do usuário logado com plano
        $establishment = Establishment::with('plan')->where('user_id', Auth::id())->first();

        if (!$establishment) {
            // Se não encontrar o estabelecimento, mostra tela de onboarding
            return Inertia::render('establishment/onboarding');
        }

        // Obter filtros da requisição
        $filterPeriod = $request->get('filter_period', 'month');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        // Definir períodos baseado nos filtros
        [$currentPeriodStart, $currentPeriodEnd, $previousPeriodStart, $previousPeriodEnd] = 
            $this->calculateFilterPeriods($filterPeriod, $startDate, $endDate);

        // Estatísticas do período atual
        $currentStats = $this->getStatsForPeriod($establishment->id, $currentPeriodStart, $currentPeriodEnd);
        $previousStats = $this->getStatsForPeriod($establishment->id, $previousPeriodStart, $previousPeriodEnd);

        // Calcular percentuais de variação
        $stats = [
            // Básicas - agora usa relacionamento many-to-many
            'total_customers' => $establishment->customers()->count(),
            
            // Métricas com comparação
            'total_appointments' => $currentStats['total_appointments'],
            'total_appointments_change' => $this->calculateChange($currentStats['total_appointments'], $previousStats['total_appointments']),
            
            'pending_appointments' => $currentStats['pending_appointments'],
            'pending_appointments_change' => $this->calculateChange($currentStats['pending_appointments'], $previousStats['pending_appointments']),
            
            'confirmed_appointments' => $currentStats['confirmed_appointments'],
            'confirmed_appointments_change' => $this->calculateChange($currentStats['confirmed_appointments'], $previousStats['confirmed_appointments']),
            
            'completed_appointments' => $currentStats['completed_appointments'],
            'completed_appointments_change' => $this->calculateChange($currentStats['completed_appointments'], $previousStats['completed_appointments']),
            
            'cancelled_appointments' => $currentStats['cancelled_appointments'],
            'cancelled_appointments_change' => $this->calculateChange($currentStats['cancelled_appointments'], $previousStats['cancelled_appointments']),
            
            'monthly_revenue' => $currentStats['revenue'],
            'monthly_revenue_change' => $this->calculateChange($currentStats['revenue'], $previousStats['revenue']),
            
            'average_ticket' => $currentStats['completed_appointments'] > 0 ? round($currentStats['revenue'] / $currentStats['completed_appointments'], 2) : 0,
            'average_ticket_change' => $this->calculateChange(
                $currentStats['completed_appointments'] > 0 ? round($currentStats['revenue'] / $currentStats['completed_appointments'], 2) : 0,
                $previousStats['completed_appointments'] > 0 ? round($previousStats['revenue'] / $previousStats['completed_appointments'], 2) : 0
            ),
            
            // Agenda livre - cálculo baseado em agendamentos vs slots disponíveis
            'free_slots_percentage' => $this->calculateFreeSlotsPercentage($establishment->id, $currentPeriodStart, $currentPeriodEnd),
            'free_slots_change' => $this->calculateFreeSlotsChange($establishment->id, $currentPeriodStart, $currentPeriodEnd, $previousPeriodStart, $previousPeriodEnd)
        ];


        // Agendamentos de hoje
        $todayAppointments = Appointment::where('establishment_id', $establishment->id)
            ->with(['customer', 'service'])
            ->whereDate('scheduled_at', today())
            ->orderBy('scheduled_at')
            ->get();

        // Chart de faturamento com período configurável
        $chartPeriod = $request->get('chart_period', 'month'); // day, week, month, year
        $revenueChart = $this->getRevenueChart($establishment->id, $chartPeriod);

        // Relatórios adicionais
        $reportsData = [
            'recent_customers' => $establishment->customers()->latest('customer_establishments.created_at')->limit(5)->get(),
            'revenue_chart' => $revenueChart,
        ];

        return Inertia::render('establishment/dashboard', [
            'establishment' => $establishment,
            'stats' => $stats,
            'todayAppointments' => $todayAppointments,
            'reportsData' => $reportsData,
            'chartPeriod' => $chartPeriod,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
            'filterPeriod' => $filterPeriod,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    /**
     * Processa o onboarding do estabelecimento
     */
    public function storeOnboarding(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:establishments,email',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:50',
            'postal_code' => 'required|string|max:20',
        ]);

        // Criar o estabelecimento com trial do único plano ativo (PLANO PRO)
        $trialDays = config('efipay.subscription.trial_days', 7);
        $activePlan = \App\Models\Plan::where('is_active', true)->first();
        
        if (!$activePlan) {
            throw new \Exception('Nenhum plano ativo encontrado no sistema');
        }
        
        $establishment = Establishment::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'slug' => \Str::slug($request->name),
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'state' => $request->state,
            'postal_code' => $request->postal_code,
            'plan_id' => $activePlan->id, // Único plano ativo (PLANO PRO)
            'status' => 'active',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays($trialDays),
            'subscription_started_at' => now(),
        ]);

        return redirect()->route('dashboard')->with('success', 'Estabelecimento configurado com sucesso!');
    }

    /**
     * Obter estatísticas para um período específico
     */
    private function getStatsForPeriod($establishmentId, $startDate, $endDate)
    {
        // Buscar todos os agendamentos do período
        $appointments = Appointment::where('establishment_id', $establishmentId)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->get();

        $totalAppointments = $appointments->count();
        $pendingAppointments = $appointments->where('status', 'pending')->count();
        $confirmedAppointments = $appointments->where('status', 'confirmed')->count();
        $completedAppointments = $appointments->where('status', 'completed')->count();
        $cancelledAppointments = $appointments->where('status', 'cancelled')->count();
        
        // Calcular receita apenas dos agendamentos concluídos
        $revenue = $appointments->where('status', 'completed')->sum(function($appointment) {
            return $appointment->price - $appointment->discount_amount;
        });

        return [
            'total_appointments' => $totalAppointments,
            'pending_appointments' => $pendingAppointments,
            'confirmed_appointments' => $confirmedAppointments,
            'completed_appointments' => $completedAppointments,
            'cancelled_appointments' => $cancelledAppointments,
            'revenue' => (float) $revenue,
        ];
    }

    /**
     * Calcular percentual de mudança entre dois valores
     */
    private function calculateChange($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        
        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * Gerar dados do chart de faturamento conforme período selecionado
     */
    private function getRevenueChart($establishmentId, $period = 'month')
    {
        $data = [];
        
        switch ($period) {
            case 'day':
                // Últimos 30 dias
                for ($i = 29; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $startDate = $date->startOfDay();
                    $endDate = $date->endOfDay();
                    
                    $revenue = Appointment::where('establishment_id', $establishmentId)
                        ->whereBetween('scheduled_at', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->selectRaw('SUM(price - discount_amount) as total_revenue')
                        ->value('total_revenue') ?? 0;
                        
                    $data[] = [
                        'period' => $date->format('d/m'),
                        'revenue' => (float) $revenue,
                    ];
                }
                break;
                
            case 'week':
                // Últimas 12 semanas
                for ($i = 11; $i >= 0; $i--) {
                    $startDate = now()->subWeeks($i)->startOfWeek();
                    $endDate = now()->subWeeks($i)->endOfWeek();
                    
                    $revenue = Appointment::where('establishment_id', $establishmentId)
                        ->whereBetween('scheduled_at', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->selectRaw('SUM(price - discount_amount) as total_revenue')
                        ->value('total_revenue') ?? 0;
                        
                    $data[] = [
                        'period' => 'Sem ' . $startDate->format('d/m'),
                        'revenue' => (float) $revenue,
                    ];
                }
                break;
                
            case 'year':
                // Últimos 5 anos
                for ($i = 4; $i >= 0; $i--) {
                    $startDate = now()->subYears($i)->startOfYear();
                    $endDate = now()->subYears($i)->endOfYear();
                    
                    $revenue = Appointment::where('establishment_id', $establishmentId)
                        ->whereBetween('scheduled_at', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->selectRaw('SUM(price - discount_amount) as total_revenue')
                        ->value('total_revenue') ?? 0;
                        
                    $data[] = [
                        'period' => $startDate->format('Y'),
                        'revenue' => (float) $revenue,
                    ];
                }
                break;
                
            default: // month
                // Últimos 6 meses
                for ($i = 5; $i >= 0; $i--) {
                    $startDate = now()->subMonths($i)->startOfMonth();
                    $endDate = now()->subMonths($i)->endOfMonth();
                    
                    $revenue = Appointment::where('establishment_id', $establishmentId)
                        ->whereBetween('scheduled_at', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->selectRaw('SUM(price - discount_amount) as total_revenue')
                        ->value('total_revenue') ?? 0;
                        
                    $data[] = [
                        'period' => $startDate->format('M Y'),
                        'revenue' => (float) $revenue,
                    ];
                }
                break;
        }
        
        return $data;
    }

    /**
     * Calcular a porcentagem de slots livres na agenda
     */
    private function calculateFreeSlotsPercentage($establishmentId, $startDate, $endDate)
    {
        // Assumindo um horário comercial básico: 8h às 18h = 10 horas por dia
        // Com slots de 1 hora = 10 slots por dia
        $workingHoursPerDay = 10;
        $daysInPeriod = $startDate->diffInDays($endDate) + 1;
        
        // Total de slots disponíveis no período
        $totalSlotsAvailable = $daysInPeriod * $workingHoursPerDay;
        
        // Slots ocupados (agendamentos confirmados e completados)
        $occupiedSlots = Appointment::where('establishment_id', $establishmentId)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->whereIn('status', ['confirmed', 'completed'])
            ->count();
            
        if ($totalSlotsAvailable == 0) {
            return 0;
        }
        
        $freeSlotsPercentage = (($totalSlotsAvailable - $occupiedSlots) / $totalSlotsAvailable) * 100;
        
        return round(max(0, min(100, $freeSlotsPercentage)), 1);
    }

    /**
     * Calcular a variação percentual de slots livres entre períodos
     */
    private function calculateFreeSlotsChange($establishmentId, $currentStart, $currentEnd, $previousStart, $previousEnd)
    {
        $currentFreeSlots = $this->calculateFreeSlotsPercentage($establishmentId, $currentStart, $currentEnd);
        $previousFreeSlots = $this->calculateFreeSlotsPercentage($establishmentId, $previousStart, $previousEnd);
        
        if ($previousFreeSlots == 0) {
            return $currentFreeSlots > 0 ? 100 : 0;
        }
        
        return round($currentFreeSlots - $previousFreeSlots, 1);
    }

    /**
     * Calcular períodos baseado no filtro selecionado
     */
    private function calculateFilterPeriods($filterPeriod, $startDate = null, $endDate = null)
    {
        $now = now();
        
        switch ($filterPeriod) {
            case 'day':
                // Período atual: hoje
                $currentPeriodStart = $now->copy()->startOfDay();
                $currentPeriodEnd = $now->copy()->endOfDay();
                // Período anterior: ontem (para comparação)
                $previousPeriodStart = $now->copy()->subDay()->startOfDay();
                $previousPeriodEnd = $now->copy()->subDay()->endOfDay();
                break;
                
            case 'week':
                $currentPeriodStart = $now->copy()->startOfWeek();
                $currentPeriodEnd = $now->copy()->endOfWeek();
                $previousPeriodStart = $now->copy()->subWeek()->startOfWeek();
                $previousPeriodEnd = $now->copy()->subWeek()->endOfWeek();
                break;
                
            case 'year':
                $currentPeriodStart = $now->copy()->startOfYear();
                $currentPeriodEnd = $now->copy()->endOfYear();
                $previousPeriodStart = $now->copy()->subYear()->startOfYear();
                $previousPeriodEnd = $now->copy()->subYear()->endOfYear();
                break;
                
            case 'custom':
                if ($startDate && $endDate) {
                    $currentPeriodStart = Carbon::parse($startDate)->startOfDay();
                    $currentPeriodEnd = Carbon::parse($endDate)->endOfDay();
                    
                    // Calcular período anterior com a mesma duração
                    $duration = $currentPeriodStart->diffInDays($currentPeriodEnd);
                    $previousPeriodStart = $currentPeriodStart->copy()->subDays($duration + 1);
                    $previousPeriodEnd = $currentPeriodStart->copy()->subDay()->endOfDay();
                } else {
                    // Fallback para mês se datas customizadas não forem fornecidas
                    $currentPeriodStart = $now->copy()->startOfMonth();
                    $currentPeriodEnd = $now->copy()->endOfMonth();
                    $previousPeriodStart = $now->copy()->subMonth()->startOfMonth();
                    $previousPeriodEnd = $now->copy()->subMonth()->endOfMonth();
                }
                break;
                
            default: // 'month'
                $currentPeriodStart = $now->copy()->startOfMonth();
                $currentPeriodEnd = $now->copy()->endOfMonth();
                $previousPeriodStart = $now->copy()->subMonth()->startOfMonth();
                $previousPeriodEnd = $now->copy()->subMonth()->endOfMonth();
                break;
        }
        
        return [$currentPeriodStart, $currentPeriodEnd, $previousPeriodStart, $previousPeriodEnd];
    }
}
