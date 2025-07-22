<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\Customer;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        $filter = $request->get('filter', 'day'); // day, week, month
        $date = $request->get('date', now()->format('Y-m-d'));
        
        $query = Appointment::with(['customer', 'service'])
            ->where('establishment_id', $establishment->id)
            ->orderBy('scheduled_at');

        // Apply date filters
        switch ($filter) {
            case 'week':
                $startOfWeek = Carbon::parse($date)->startOfWeek();
                $endOfWeek = Carbon::parse($date)->endOfWeek();
                $query->whereBetween('scheduled_at', [$startOfWeek, $endOfWeek]);
                break;
                
            case 'month':
                $startOfMonth = Carbon::parse($date)->startOfMonth();
                $endOfMonth = Carbon::parse($date)->endOfMonth();
                $query->whereBetween('scheduled_at', [$startOfMonth, $endOfMonth]);
                break;
                
            default: // day
                $query->whereDate('scheduled_at', $date);
                break;
        }

        $appointments = $query->get();

        // Statistics
        $confirmedCount = $appointments->where('status', 'confirmed')->count();
        $completedCount = $appointments->where('status', 'completed')->count();
        $pendingCount = $appointments->where('status', 'pending')->count();
        $cancelledCount = $appointments->where('status', 'cancelled')->count();

        return Inertia::render('establishment/appointments/Index', [
            'appointments' => $appointments,
            'filter' => $filter,
            'date' => $date,
            'statistics' => [
                'confirmed' => $confirmedCount,
                'completed' => $completedCount,
                'pending' => $pendingCount,
                'cancelled' => $cancelledCount,
                'total' => $appointments->count(),
            ],
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function agenda(Request $request): Response
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        $date = $request->get('date', now()->format('Y-m-d'));
        
        // Today's appointments - only confirmed and started appointments
        $todayAppointments = Appointment::with(['customer', 'service'])
            ->where('establishment_id', $establishment->id)
            ->whereDate('scheduled_at', $date)
            ->whereIn('status', ['confirmed', 'started', 'completed'])
            ->orderBy('scheduled_at')
            ->get();

        // Current appointment in service (started status)
        $currentAppointment = $todayAppointments
            ->where('status', 'started')
            ->sortBy('scheduled_at')
            ->first();

        // Next client (only if no one is currently being served)
        $nextClient = null;
        if (!$currentAppointment) {
            $nextClient = $todayAppointments
                ->where('status', 'confirmed')
                ->sortBy('scheduled_at')
                ->first();
        }

        // Queue for today - only confirmed appointments (waiting queue)
        $queue = $todayAppointments
            ->where('status', 'confirmed')
            ->sortBy('scheduled_at')
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'time' => $appointment->scheduled_at->format('H:i'),
                    'customer_name' => $appointment->customer->name,
                    'customer_surname' => $appointment->customer->surname ?? '',
                    'service_name' => $appointment->service->name,
                    'duration' => $appointment->service->duration_minutes,
                    'price' => $appointment->price,
                    'discount_code' => $appointment->discount_code,
                    'discount_amount' => $appointment->discount_amount,
                    'final_price' => $appointment->price - $appointment->discount_amount,
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                ];
            })
            ->values(); // Reset array keys

        return Inertia::render('establishment/appointments/Agenda', [
            'todayAppointments' => $todayAppointments,
            'currentAppointment' => $currentAppointment,
            'nextClient' => $nextClient,
            'queue' => $queue,
            'date' => $date,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function create(Request $request): Response
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        $services = Service::where('establishment_id', $establishment->id)
            ->where('is_active', true)
            ->get();
            
        $customers = Customer::whereHas('establishments', function ($query) use ($establishment) {
                $query->where('establishment_id', $establishment->id);
            })
            ->orderBy('name')
            ->get();

        // Get pre-selected customer if provided
        $selectedCustomerId = $request->get('customer_id');
        $selectedCustomer = null;
        
        if ($selectedCustomerId) {
            $selectedCustomer = Customer::where('establishment_id', $establishment->id)
                ->find($selectedCustomerId);
        }

        return Inertia::render('establishment/appointments/Create', [
            'services' => $services,
            'customers' => $customers,
            'selectedCustomer' => $selectedCustomer,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function store(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'scheduled_at' => 'required|date|after:now',
            'notes' => 'nullable|string|max:1000',
            'discount_code' => 'nullable|string',
        ]);

        $service = Service::findOrFail($validated['service_id']);
        
        // Calculate price with discount if applicable
        $price = $service->price;
        $discountAmount = 0;
        
        if (!empty($validated['discount_code'])) {
            // Here you would validate the coupon/discount code
            // For now, we'll skip this logic
        }

        $appointment = Appointment::create([
            'establishment_id' => $establishment->id,
            'customer_id' => $validated['customer_id'],
            'service_id' => $validated['service_id'],
            'scheduled_at' => $validated['scheduled_at'],
            'duration_minutes' => $service->duration_minutes,
            'price' => $price,
            'discount_amount' => $discountAmount,
            'discount_code' => $validated['discount_code'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        // Load customer relationship for notification
        $appointment->load('customer', 'service');

        // Create notification for new appointment
        Notification::createForAppointment(
            $appointment,
            'appointment_pending',
            '⏰ Novo agendamento aguardando confirmação!',
            "Agendamento para {$appointment->service->name} em " . 
            $appointment->scheduled_at->format('d/m/Y \à\s H:i')
        );

        return redirect()->route('appointments.index')
            ->with('success', 'Agendamento criado com sucesso!');
    }

    public function show(Appointment $appointment): Response
    {
        $this->authorize('view', $appointment);
        
        $appointment->load(['customer', 'service']);
        $establishment = auth()->user()->establishment()->with('plan')->first();

        return Inertia::render('establishment/appointments/Show', [
            'appointment' => $appointment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function edit(Appointment $appointment): Response
    {
        $this->authorize('update', $appointment);
        
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        $services = Service::where('establishment_id', $establishment->id)
            ->where('is_active', true)
            ->get();
            
        $customers = Customer::whereHas('establishments', function ($query) use ($establishment) {
                $query->where('establishment_id', $establishment->id);
            })
            ->orderBy('name')
            ->get();

        $appointment->load(['customer', 'service']);

        return Inertia::render('establishment/appointments/Edit', [
            'appointment' => $appointment,
            'services' => $services,
            'customers' => $customers,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);
        
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'scheduled_at' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,confirmed,started,completed,cancelled',
            'cancellation_reason' => 'required_if:status,cancelled|nullable|string|max:500',
        ]);

        $service = Service::findOrFail($validated['service_id']);
        
        $appointment->update([
            'customer_id' => $validated['customer_id'],
            'service_id' => $validated['service_id'],
            'scheduled_at' => $validated['scheduled_at'],
            'duration_minutes' => $service->duration_minutes,
            'price' => $service->price,
            'notes' => $validated['notes'],
            'status' => $validated['status'],
            'cancellation_reason' => $validated['cancellation_reason'] ?? null,
        ]);

        return redirect()->route('appointments.index')
            ->with('success', 'Agendamento atualizado com sucesso!');
    }

    public function updateStatus(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);
        
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,started,completed,cancelled',
            'cancellation_reason' => 'required_if:status,cancelled|nullable|string|max:500',
        ]);

        $updateData = ['status' => $validated['status']];
        
        // Handle status-specific logic
        switch ($validated['status']) {
            case 'started':
                $updateData['started_at'] = now();
                break;
                
            case 'completed':
                if (!$appointment->started_at) {
                    $updateData['started_at'] = $appointment->scheduled_at;
                }
                $updateData['completed_at'] = now();
                break;
                
            case 'cancelled':
                $updateData['cancellation_reason'] = $validated['cancellation_reason'];
                break;
        }

        $appointment->update($updateData);
        $appointment->load(['customer', 'service']);

        // Create notification based on status change
        $this->createStatusNotification($appointment, $validated['status']);

        return back()->with('success', 'Status do agendamento atualizado com sucesso!');
    }

    public function startTimer(Appointment $appointment)
    {
        $this->authorize('update', $appointment);
        
        if ($appointment->status !== 'confirmed') {
            return back()->withErrors([
                'timer' => 'Apenas agendamentos confirmados podem ser iniciados.'
            ]);
        }

        $appointment->update([
            'status' => 'started',
            'started_at' => now(),
        ]);

        // Load relationships for notification
        $appointment->load(['customer', 'service']);

        // Create notification for started appointment
        $this->createStatusNotification($appointment, 'started');

        return back()->with('success', 'Timer iniciado com sucesso!');
    }

    public function completeService(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);
        
        if ($appointment->status !== 'started') {
            return back()->withErrors([
                'timer' => 'Apenas agendamentos iniciados podem ser concluídos.'
            ]);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $appointment->update([
            'status' => 'completed',
            'completed_at' => now(),
            'notes' => $validated['notes'] ?? $appointment->notes,
        ]);

        $appointment->load(['customer', 'service']);

        // Create notification for completed appointment
        $this->createStatusNotification($appointment, 'completed');

        return back()->with('success', 'Serviço concluído com sucesso!');
    }

    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);
        
        $appointment->delete();

        return redirect()->route('appointments.index')
            ->with('success', 'Agendamento excluído com sucesso!');
    }

    private function createStatusNotification(Appointment $appointment, string $status): void
    {
        $customerName = $appointment->customer->name;
        $serviceName = $appointment->service->name;
        $dateTime = $appointment->scheduled_at->format('d/m/Y \à\s H:i');

        $titles = [
            'confirmed' => "🎉 Maravilha! {$customerName} confirmou seu agendamento",
            'started' => "⚡ Atendimento iniciado para {$customerName}",
            'completed' => "✅ Sucesso! Atendimento de {$customerName} concluído",
            'cancelled' => "😔 Que pena! {$customerName} cancelou seu agendamento",
            'rescheduled' => "🔄 Opa! {$customerName} remarcou seu agendamento",
        ];

        $messages = [
            'confirmed' => "Agendamento para {$serviceName} em {$dateTime}",
            'started' => "Atendimento de {$serviceName} em andamento",
            'completed' => "Atendimento de {$serviceName} foi finalizado com sucesso",
            'cancelled' => "Agendamento para {$serviceName} em {$dateTime} foi cancelado",
            'rescheduled' => "Agendamento para {$serviceName} foi remarcado",
        ];

        $notificationType = match($status) {
            'confirmed' => 'appointment_confirmed',
            'started' => 'appointment_confirmed', // Using confirmed for started
            'completed' => 'appointment_completed',
            'cancelled' => 'appointment_cancelled',
            default => 'appointment_rescheduled'
        };

        if (isset($titles[$status])) {
            Notification::createForAppointment(
                $appointment,
                $notificationType,
                $titles[$status],
                $messages[$status]
            );
        }
    }
}