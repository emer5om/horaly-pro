<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CustomerFavoriteService;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    /**
     * Lista os agendamentos do cliente com filtros
     */
    public function index(Request $request): Response
    {
        $customer = Auth::guard('customer')->user();
        $filter = $request->get('filter', 'upcoming'); // upcoming, history, all
        $status = $request->get('status');
        $establishment = $request->get('establishment');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $query = Appointment::with(['service', 'establishment'])
            ->where('customer_id', $customer->id)
            ->orderBy('scheduled_at', 'desc');

        // Aplicar filtros
        switch ($filter) {
            case 'upcoming':
                $query->where('scheduled_at', '>=', now())
                      ->whereIn('status', ['pending', 'confirmed', 'started']);
                break;
            case 'history':
                $query->where(function($q) {
                    $q->where('scheduled_at', '<', now())
                      ->orWhereIn('status', ['completed', 'cancelled']);
                });
                break;
            // 'all' não aplica filtro de data
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($establishment) {
            $query->where('establishment_id', $establishment);
        }

        if ($dateFrom) {
            $query->whereDate('scheduled_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('scheduled_at', '<=', $dateTo);
        }

        $appointments = $query->paginate(10)->withQueryString();

        // Estabelecimentos para filtro
        $establishments = Appointment::with('establishment')
            ->where('customer_id', $customer->id)
            ->get()
            ->pluck('establishment')
            ->unique('id')
            ->values();

        // Estatísticas
        $stats = [
            'total' => Appointment::where('customer_id', $customer->id)->count(),
            'upcoming' => Appointment::where('customer_id', $customer->id)
                ->where('scheduled_at', '>=', now())
                ->whereIn('status', ['pending', 'confirmed', 'started'])
                ->count(),
            'completed' => Appointment::where('customer_id', $customer->id)
                ->where('status', 'completed')
                ->count(),
            'cancelled' => Appointment::where('customer_id', $customer->id)
                ->where('status', 'cancelled')
                ->count(),
        ];

        return Inertia::render('customer/appointments/Index', [
            'appointments' => $appointments,
            'establishments' => $establishments,
            'filters' => [
                'filter' => $filter,
                'status' => $status,
                'establishment' => $establishment,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Exibe detalhes de um agendamento
     */
    public function show(Appointment $appointment): Response
    {
        $customer = Auth::guard('customer')->user();

        if ($appointment->customer_id !== $customer->id) {
            abort(403);
        }

        $appointment->load(['service', 'establishment']);

        $establishment = $appointment->establishment;
        $service = $appointment->service;

        // Verificar se pode reagendar baseado nas configurações do estabelecimento E do serviço
        $canReschedule = $establishment->allow_rescheduling
            && $service->allow_rescheduling
            && in_array($appointment->status, ['pending', 'confirmed']) 
            && $appointment->scheduled_at > now()->addHours($establishment->reschedule_advance_hours ?? 24);

        // Verificar se pode cancelar baseado nas configurações do estabelecimento E do serviço  
        $canCancel = $establishment->allow_cancellation
            && $service->allow_cancellation
            && in_array($appointment->status, ['pending', 'confirmed']) 
            && $appointment->scheduled_at > now()->addHours($establishment->cancel_advance_hours ?? 2);

        return Inertia::render('customer/appointments/Show', [
            'appointment' => $appointment,
            'canReschedule' => $canReschedule,
            'canCancel' => $canCancel,
            'establishmentSettings' => [
                'allow_rescheduling' => $establishment->allow_rescheduling,
                'allow_cancellation' => $establishment->allow_cancellation,
                'reschedule_advance_hours' => $establishment->reschedule_advance_hours ?? 24,
                'cancel_advance_hours' => $establishment->cancel_advance_hours ?? 2,
            ],
            'serviceSettings' => [
                'allow_rescheduling' => $service->allow_rescheduling,
                'allow_cancellation' => $service->allow_cancellation,
            ],
        ]);
    }

    /**
     * Reagenda um agendamento - redireciona para o booking do estabelecimento
     */
    public function reschedule(Request $request, Appointment $appointment)
    {
        $customer = Auth::guard('customer')->user();

        if ($appointment->customer_id !== $customer->id) {
            abort(403);
        }

        $establishment = $appointment->establishment;
        $service = $appointment->service;

        // Verificar se o estabelecimento permite reagendamento
        if (!$establishment->allow_rescheduling) {
            return back()->withErrors(['message' => 'Este estabelecimento não permite reagendamentos.']);
        }

        // Verificar se o serviço permite reagendamento
        if (!$service->allow_rescheduling) {
            return back()->withErrors(['message' => 'Este serviço não permite reagendamentos.']);
        }

        if (!in_array($appointment->status, ['pending', 'confirmed'])) {
            return back()->withErrors(['message' => 'Este agendamento não pode ser reagendado.']);
        }

        $advanceHours = $establishment->reschedule_advance_hours ?? 24;
        if ($appointment->scheduled_at <= now()->addHours($advanceHours)) {
            return back()->withErrors(['message' => "Não é possível reagendar com menos de {$advanceHours} horas de antecedência."]);
        }
        
        // Usar booking_slug se disponível, senão usar slug padrão
        $slug = $establishment->booking_slug ?: $establishment->slug;
        $bookingUrl = url('/' . $slug);
        
        return redirect()->away($bookingUrl);
    }

    /**
     * Repete um agendamento - redireciona para o booking do estabelecimento
     */
    public function repeat(Request $request, Appointment $appointment)
    {
        $customer = Auth::guard('customer')->user();

        if ($appointment->customer_id !== $customer->id) {
            abort(403);
        }

        $establishment = $appointment->establishment;
        
        // Usar booking_slug se disponível, senão usar slug padrão
        $slug = $establishment->booking_slug ?: $establishment->slug;
        $bookingUrl = url('/' . $slug);
        
        return redirect()->away($bookingUrl);
    }

    /**
     * Cancela um agendamento
     */
    public function cancel(Request $request, Appointment $appointment)
    {
        $customer = Auth::guard('customer')->user();

        if ($appointment->customer_id !== $customer->id) {
            abort(403);
        }

        $establishment = $appointment->establishment;
        $service = $appointment->service;

        // Verificar se o estabelecimento permite cancelamento
        if (!$establishment->allow_cancellation) {
            return back()->withErrors(['message' => 'Este estabelecimento não permite cancelamentos.']);
        }

        // Verificar se o serviço permite cancelamento
        if (!$service->allow_cancellation) {
            return back()->withErrors(['message' => 'Este serviço não permite cancelamentos.']);
        }

        if (!in_array($appointment->status, ['pending', 'confirmed'])) {
            return back()->withErrors(['message' => 'Este agendamento não pode ser cancelado.']);
        }

        $advanceHours = $establishment->cancel_advance_hours ?? 2;
        if ($appointment->scheduled_at <= now()->addHours($advanceHours)) {
            return back()->withErrors(['message' => "Não é possível cancelar com menos de {$advanceHours} horas de antecedência."]);
        }

        $appointment->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->get('reason', 'Cancelado pelo cliente'),
        ]);

        return redirect()->route('customer.appointments')
            ->with('success', 'Agendamento cancelado com sucesso.');
    }

    /**
     * Toggle favorito de um serviço
     */
    public function toggleFavorite(Service $service)
    {
        $customer = Auth::guard('customer')->user();

        $favorite = CustomerFavoriteService::where('customer_id', $customer->id)
            ->where('service_id', $service->id)
            ->first();

        if ($favorite) {
            $favorite->delete();
            $message = 'Serviço removido dos favoritos';
        } else {
            CustomerFavoriteService::create([
                'customer_id' => $customer->id,
                'service_id' => $service->id,
            ]);
            $message = 'Serviço adicionado aos favoritos';
        }

        return back()->with('success', $message);
    }

    /**
     * Lista serviços favoritos
     */
    public function favorites(): Response
    {
        $customer = Auth::guard('customer')->user();

        $favorites = CustomerFavoriteService::with(['service.establishment'])
            ->where('customer_id', $customer->id)
            ->get();

        return Inertia::render('customer/Favorites', [
            'favorites' => $favorites,
        ]);
    }
}