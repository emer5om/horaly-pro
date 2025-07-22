<?php

namespace App\Http\Controllers;

use App\Models\Establishment;
use App\Models\Customer;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\BlockedDate;
use App\Models\BlockedTime;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function show($slug)
    {
        $establishment = Establishment::where(function($query) use ($slug) {
                $query->where('booking_slug', $slug)
                      ->orWhere('slug', $slug);
            })
            ->where('is_active', true)
            ->with(['services' => function($query) {
                $query->where('is_active', true);
            }, 'blockedDates', 'blockedTimes'])
            ->first();

        if (!$establishment) {
            abort(404, 'Estabelecimento não encontrado');
        }

        // Generate mock time slots for now
        $timeSlots = [
            ['time' => '09:00', 'available' => true],
            ['time' => '09:30', 'available' => true],
            ['time' => '10:00', 'available' => false],
            ['time' => '10:30', 'available' => true],
            ['time' => '11:00', 'available' => true],
            ['time' => '11:30', 'available' => false],
            ['time' => '14:00', 'available' => true],
            ['time' => '14:30', 'available' => true],
            ['time' => '15:00', 'available' => true],
            ['time' => '15:30', 'available' => true],
            ['time' => '16:00', 'available' => true],
            ['time' => '16:30', 'available' => true],
        ];

        return Inertia::render('public/booking', [
            'establishment' => $establishment->only([
                'id',
                'name',
                'description',
                'booking_slug',
                'booking_slogan',
                'booking_logo',
                'booking_banner',
                'booking_primary_color',
                'booking_secondary_color',
                'booking_theme',
                'phone',
                'email',
                'address',
                'instagram',
                'services',
                'blockedDates',
                'blockedTimes',
                'working_hours',
                'required_fields',
                'booking_fee_enabled',
                'booking_fee_type',
                'booking_fee_amount',
                'booking_fee_percentage',
                'mercadopago_access_token',
                'accepted_payment_methods',
                'facebook_pixel_id',
                'google_analytics_id',
                'google_tag_id',
                'earliest_booking_time',
                'latest_booking_time'
            ]),
            'timeSlots' => $timeSlots,
        ]);
    }

    public function store(Request $request, $slug)
    {
        $establishment = Establishment::where(function($query) use ($slug) {
                $query->where('booking_slug', $slug)
                      ->orWhere('slug', $slug);
            })
            ->where('is_active', true)
            ->with('plan')
            ->firstOrFail();

        // Check appointment limit for the establishment's plan
        if (!$this->canCreateAppointment($establishment)) {
            return redirect()->back()->with('error', 'Limite de agendamentos mensais do plano atingido. Entre em contato com o estabelecimento.');
        }

        $requiredFields = $establishment->required_fields ?? ['name', 'phone'];
        
        // Validação dinâmica baseada nos campos obrigatórios
        $validationRules = [
            'service_id' => 'required|exists:services,id',
            'appointment_date' => 'required|date|after:today',
            'appointment_time' => 'required|date_format:H:i',
        ];

        foreach ($requiredFields as $field) {
            switch ($field) {
                case 'name':
                    $validationRules['name'] = 'required|string|max:255';
                    break;
                case 'phone':
                    $validationRules['phone'] = 'required|string|max:20';
                    break;
                case 'email':
                    $validationRules['email'] = 'required|email|max:255';
                    break;
                case 'last_name':
                    $validationRules['last_name'] = 'required|string|max:255';
                    break;
                case 'birth_date':
                    $validationRules['birth_date'] = 'required|date|before:today';
                    break;
            }
        }

        $request->validate($validationRules);

        // Criar ou encontrar cliente (agora por telefone/email global)
        $customerData = [
            'name' => $request->name,
            'phone' => $request->phone,
        ];

        if (in_array('email', $requiredFields)) {
            $customerData['email'] = $request->email;
        }

        if (in_array('last_name', $requiredFields)) {
            $customerData['last_name'] = $request->last_name;
        }

        if (in_array('birth_date', $requiredFields)) {
            $customerData['birth_date'] = $request->birth_date;
        }

        // Buscar cliente existente por telefone (globalmente)
        $customer = Customer::where('phone', $request->phone)->first();
        
        if ($customer) {
            // Atualizar dados do cliente se necessário
            $customer->update($customerData);
        } else {
            // Criar novo cliente
            $customer = Customer::create($customerData);
        }
        
        // Associar cliente ao estabelecimento se ainda não estiver associado
        if (!$customer->establishments()->where('establishment_id', $establishment->id)->exists()) {
            $customer->establishments()->attach($establishment->id);
        }

        // Criar agendamento
        $appointment = Appointment::create([
            'establishment_id' => $establishment->id,
            'customer_id' => $customer->id,
            'service_id' => $request->service_id,
            'appointment_date' => $request->appointment_date,
            'appointment_time' => $request->appointment_time,
            'status' => 'scheduled',
        ]);

        return redirect()->back()->with('success', 'Agendamento realizado com sucesso!');
    }

    public function getAvailableTimes(Request $request)
    {
        $date = $request->get('date');
        $serviceId = $request->get('service_id');
        $establishmentSlug = $request->get('establishment_slug');

        if (!$date || !$serviceId || !$establishmentSlug) {
            return response()->json(['timeSlots' => []]);
        }

        $establishment = Establishment::where(function($query) use ($establishmentSlug) {
                $query->where('booking_slug', $establishmentSlug)
                      ->orWhere('slug', $establishmentSlug);
            })->first();
        $service = Service::find($serviceId);

        if (!$establishment || !$service) {
            return response()->json(['timeSlots' => []]);
        }

        $timeSlots = $this->generateAvailableTimeSlots($establishment, $service, $date);

        return response()->json(['timeSlots' => $timeSlots]);
    }

    public function getDayAvailability(Request $request)
    {
        $establishmentSlug = $request->get('establishment_slug');
        $serviceId = $request->get('service_id');
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('m'));

        if (!$establishmentSlug || !$serviceId) {
            return response()->json(['dayStatus' => []]);
        }

        $establishment = Establishment::where(function($query) use ($establishmentSlug) {
                $query->where('booking_slug', $establishmentSlug)
                      ->orWhere('slug', $establishmentSlug);
            })->first();
        $service = Service::find($serviceId);

        if (!$establishment || !$service) {
            return response()->json(['dayStatus' => []]);
        }

        $dayStatus = $this->generateDayAvailability($establishment, $service, $year, $month);

        return response()->json(['dayStatus' => $dayStatus]);
    }

    private function generateAvailableTimeSlots($establishment, $service, $date)
    {
        $carbon = Carbon::parse($date);
        $dayOfWeek = strtolower($carbon->format('l')); // monday, tuesday, etc.
        $now = Carbon::now();
        $isToday = $carbon->isToday();
        
        // Get working hours for this day
        $workingHours = $establishment->working_hours[$dayOfWeek] ?? null;
        if (!$workingHours || !($workingHours['active'] ?? $workingHours['is_open'] ?? false)) {
            return [];
        }

        // Check if entire date is blocked
        $isDateBlocked = $this->isDateBlocked($establishment, $carbon);

        $timeSlots = [];
        // Use start_time/end_time if available, fallback to start/end
        $startTime = Carbon::parse($workingHours['start_time'] ?? $workingHours['start']);
        $endTime = Carbon::parse($workingHours['end_time'] ?? $workingHours['end']);
        $slotInterval = 30; // 30 minutes interval
        $serviceDuration = $service->duration_minutes;

        $current = $startTime->copy();
        
        while ($current->copy()->addMinutes($serviceDuration)->lte($endTime)) {
            $timeString = $current->format('H:i');
            
            // Create full datetime for comparison
            $slotDateTime = $carbon->copy()->setTimeFromTimeString($timeString);
            
            // Check if slot is in the past
            $isPast = $isToday && $slotDateTime->lte($now);
            
            // Determine availability and status
            $isAvailable = false;
            $status = 'available'; // available, occupied, past, blocked
            
            if ($isPast) {
                $status = 'past';
            } elseif ($isDateBlocked) {
                $status = 'blocked';
            } else {
                $slotAvailable = $this->isTimeSlotAvailable(
                    $establishment,
                    $service,
                    $carbon,
                    $current,
                    $serviceDuration
                );
                
                if ($slotAvailable) {
                    $isAvailable = true;
                    $status = 'available';
                } else {
                    $status = 'occupied';
                }
            }

            $timeSlots[] = [
                'time' => $timeString,
                'available' => $isAvailable,
                'status' => $status,
                'isPast' => $isPast,
                'datetime' => $slotDateTime->toISOString()
            ];

            $current->addMinutes($slotInterval);
        }

        return $timeSlots;
    }

    private function isDateBlocked($establishment, $date)
    {
        // Check blocked dates
        $blockedDate = BlockedDate::where('establishment_id', $establishment->id)
            ->where(function ($query) use ($date) {
                $query->whereDate('blocked_date', $date->format('Y-m-d'))
                      ->orWhere(function ($q) use ($date) {
                          $q->where('is_recurring', true)
                            ->whereRaw('DATE_FORMAT(blocked_date, "%m-%d") = ?', [$date->format('m-d')]);
                      });
            })
            ->exists();

        return $blockedDate;
    }

    private function isTimeSlotAvailable($establishment, $service, $date, $time, $duration)
    {
        $startTime = $time->copy();
        $endTime = $time->copy()->addMinutes($duration);
        
        // Check blocked times
        $blockedTime = BlockedTime::where('establishment_id', $establishment->id)
            ->whereDate('blocked_date', $date->format('Y-m-d'))
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    // Check if any part of the service time overlaps with blocked time
                    $q->where('start_time', '<', $endTime->format('H:i'))
                      ->where('end_time', '>', $startTime->format('H:i'));
                });
            })
            ->exists();

        if ($blockedTime) {
            return false;
        }

        // Check existing appointments and slot limits
        $slotsPerHour = $establishment->slots_per_hour ?? 1;
        
        $existingAppointments = Appointment::where('establishment_id', $establishment->id)
            ->whereDate('scheduled_at', $date->format('Y-m-d'))
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($startTime, $endTime, $date) {
                $query->where(function ($q) use ($startTime, $endTime, $date) {
                    // Check if any existing appointment overlaps with this time slot
                    $startDateTime = $date->format('Y-m-d') . ' ' . $startTime->format('H:i:s');
                    $endDateTime = $date->format('Y-m-d') . ' ' . $endTime->format('H:i:s');
                    
                    $q->where('scheduled_at', '<', $endDateTime)
                      ->whereRaw('DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?', [$startDateTime]);
                });
            })
            ->count();

        return $existingAppointments < $slotsPerHour;
    }

    public function searchCustomer(Request $request, $slug = null)
    {
        $phone = $request->get('phone');
        $establishmentSlug = $slug ?: $request->get('establishment_slug');
        
        if (!$phone) {
            return response()->json(['customer' => null]);
        }

        // Remove non-numeric characters for search
        $cleanPhone = preg_replace('/\D/', '', $phone);
        
        // Search customers globally by phone (não mais por estabelecimento)
        $customer = Customer::where(function($query) use ($cleanPhone, $phone) {
            // Search by original format first
            $query->where('phone', 'like', "%{$phone}%");
            
            // Search by clean numbers in phone field
            $query->orWhere('phone', 'like', "%{$cleanPhone}%");
            
            // Search by the last 8 digits (local number without area code)
            if (strlen($cleanPhone) >= 8) {
                $localNumber = substr($cleanPhone, -8);
                $query->orWhere('phone', 'like', "%{$localNumber}%");
            }
            
            // Search by the last 9 digits (mobile with 9th digit)
            if (strlen($cleanPhone) >= 9) {
                $localNumber = substr($cleanPhone, -9);
                $query->orWhere('phone', 'like', "%{$localNumber}%");
            }
            
            // Try to find by individual parts (for formats like "5198065-1119")
            if (strlen($cleanPhone) >= 8) {
                // Try format XXXXXXX-XXXX
                $part1 = substr($cleanPhone, 0, -4);
                $part2 = substr($cleanPhone, -4);
                $formattedPattern = "{$part1}-{$part2}";
                $query->orWhere('phone', 'like', "%{$formattedPattern}%");
            }
        })->first();

        if ($customer) {
            // Se foi fornecido establishment_slug, incluir informação se já é cliente
            $isExistingCustomer = false;
            if ($establishmentSlug) {
                $establishment = Establishment::where('slug', $establishmentSlug)->first();
                if ($establishment) {
                    $isExistingCustomer = $customer->establishments()
                        ->where('establishment_id', $establishment->id)
                        ->exists();
                }
            }

            return response()->json([
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'last_name' => $customer->last_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'birth_date' => $customer->birth_date,
                    'is_existing_customer' => $isExistingCustomer,
                ]
            ]);
        }

        return response()->json(['customer' => null]);
    }

    public function validateCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'establishment_slug' => 'required|string',
            'service_id' => 'required|exists:services,id',
        ]);

        $establishment = Establishment::where(function($query) use ($request) {
                $query->where('booking_slug', $request->establishment_slug)
                      ->orWhere('slug', $request->establishment_slug);
            })->first();
        $service = Service::find($request->service_id);

        if (!$establishment || !$service) {
            return response()->json([
                'valid' => false,
                'message' => 'Estabelecimento ou serviço não encontrado'
            ]);
        }

        $coupon = Coupon::where('establishment_id', $establishment->id)
            ->where('code', strtoupper($request->code))
            ->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Cupom não encontrado'
            ]);
        }

        if (!$coupon->isValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'Cupom inválido ou expirado'
            ]);
        }

        $originalPrice = $service->final_price;
        $discount = $coupon->calculateDiscount($originalPrice);
        $finalPrice = $originalPrice - $discount;

        $discountText = $coupon->type === 'percentage' 
            ? "{$coupon->value}% de desconto"
            : "R$ " . number_format($coupon->value, 2, ',', '.');

        return response()->json([
            'valid' => true,
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'name' => $coupon->name,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount_amount' => $discount,
                'discount_text' => $discountText,
                'original_price' => $originalPrice,
                'final_price' => $finalPrice,
            ]
        ]);
    }

    public function createAppointment(Request $request)
    {
        try {
            $request->validate([
                'establishment_id' => 'required|exists:establishments,id',
                'service_id' => 'required|exists:services,id',
                'scheduled_at' => 'required|date',
                'customer.name' => 'required|string|max:255',
                'customer.phone' => 'required|string|max:20',
                'customer.email' => 'nullable|email|max:255',
                'customer.last_name' => 'nullable|string|max:255',
                'customer.birth_date' => 'nullable|date|before:today',
                'coupon_code' => 'nullable|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed in createAppointment:', [
                'errors' => $e->validator->errors()->all(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        $establishment = Establishment::with('plan')->findOrFail($request->establishment_id);
        $service = Service::findOrFail($request->service_id);

        // Check appointment limit for the establishment's plan
        if (!$this->canCreateAppointment($establishment)) {
            return response()->json([
                'success' => false,
                'message' => 'Limite de agendamentos mensais do plano atingido. Entre em contato com o estabelecimento.',
                'error' => 'APPOINTMENT_LIMIT_REACHED'
            ], 422);
        }

        // Handle coupon if provided
        $coupon = null;
        $discountAmount = 0;
        $finalPrice = $service->final_price;

        if ($request->coupon_code) {
            $coupon = Coupon::where('establishment_id', $establishment->id)
                ->where('code', strtoupper($request->coupon_code))
                ->first();

            if ($coupon && $coupon->isValid()) {
                $discountAmount = $coupon->calculateDiscount($finalPrice);
                $finalPrice = $finalPrice - $discountAmount;
                
                // Update coupon usage count
                $coupon->increment('used_count');
            }
        }

        // Create or update customer (now globally by phone)
        $customerData = [
            'name' => $request->input('customer.name'),
            'phone' => $request->input('customer.phone'),
        ];

        if ($request->input('customer.email')) {
            $customerData['email'] = $request->input('customer.email');
        }

        if ($request->input('customer.last_name')) {
            $customerData['last_name'] = $request->input('customer.last_name');
        }

        if ($request->input('customer.birth_date')) {
            $customerData['birth_date'] = $request->input('customer.birth_date');
        }

        // Buscar cliente existente por telefone (globalmente)
        $customer = Customer::where('phone', $request->input('customer.phone'))->first();
        
        if ($customer) {
            // Atualizar dados do cliente se necessário
            $customer->update($customerData);
        } else {
            // Criar novo cliente
            $customer = Customer::create($customerData);
        }
        
        // Associar cliente ao estabelecimento se ainda não estiver associado
        if (!$customer->establishments()->where('establishment_id', $establishment->id)->exists()) {
            $customer->establishments()->attach($establishment->id);
        }

        // Determine appointment status based on payment requirement
        $appointmentStatus = 'confirmed'; // Default status
        
        // Check if payment is required (booking fee enabled and MercadoPago configured)
        if ($establishment->booking_fee_enabled && $establishment->mercadopago_access_token) {
            $appointmentStatus = 'pending_payment'; // Requires payment to confirm
        }

        // Create appointment
        $appointment = Appointment::create([
            'establishment_id' => $establishment->id,
            'customer_id' => $customer->id,
            'service_id' => $request->service_id,
            'scheduled_at' => $request->scheduled_at,
            'duration_minutes' => $service->duration_minutes,
            'price' => $service->final_price, // Preço original
            'discount_amount' => $discountAmount,
            'discount_code' => $coupon?->code,
            'status' => $appointmentStatus,
        ]);

        return response()->json([
            'success' => true,
            'appointment' => $appointment,
            'message' => 'Agendamento criado com sucesso!'
        ]);
    }

    /**
     * Check if establishment can create new appointments based on plan limits
     */
    private function canCreateAppointment($establishment)
    {
        $plan = $establishment->plan;
        
        // If no plan or plan allows unlimited appointments, return true
        if (!$plan || $plan->unlimited_appointments) {
            return true;
        }
        
        // If plan has no appointment limit, return true
        if (!$plan->monthly_appointment_limit) {
            return true;
        }
        
        // Get current month's appointment count
        $currentMonth = Carbon::now()->format('Y-m');
        $currentMonthAppointments = Appointment::where('establishment_id', $establishment->id)
            ->whereRaw('DATE_FORMAT(scheduled_at, "%Y-%m") = ?', [$currentMonth])
            ->where('status', '!=', 'cancelled')
            ->count();
        
        return $plan->canCreateAppointment($currentMonthAppointments);
    }

    private function generateDayAvailability($establishment, $service, $year, $month)
    {
        $dayStatus = [];
        $today = Carbon::today();
        $currentMonth = Carbon::createFromDate($year, $month, 1);
        $daysInMonth = $currentMonth->daysInMonth;

        // Calculate earliest allowed booking date based on establishment settings
        $earliestAllowedDate = $this->calculateEarliestBookingDate($establishment);
        
        // Calculate latest allowed booking date based on establishment settings
        $latestAllowedDate = $this->calculateLatestBookingDate($establishment);

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = Carbon::createFromDate($year, $month, $day);
            $dayKey = $date->format('Y-m-d');
            
            // Don't allow past dates
            if ($date->lt($today)) {
                $dayStatus[$dayKey] = 'past';
                continue;
            }
            
            // Check if date is before earliest allowed booking date
            if ($date->lt($earliestAllowedDate)) {
                $dayStatus[$dayKey] = 'past';
                continue;
            }
            
            // Check if date is after latest allowed booking date
            if ($latestAllowedDate && $date->gt($latestAllowedDate)) {
                $dayStatus[$dayKey] = 'blocked';
                continue;
            }
            
            // Check if day is today and if there are still available slots
            if ($date->isToday()) {
                $timeSlots = $this->generateAvailableTimeSlots($establishment, $service, $dayKey);
                $hasAvailableSlots = collect($timeSlots)->where('status', 'available')->count() > 0;
                $dayStatus[$dayKey] = $hasAvailableSlots ? 'available' : 'unavailable';
                continue;
            }

            // Get day of week
            $dayOfWeek = strtolower($date->format('l'));
            
            // Check if establishment is open on this day
            $workingHours = $establishment->working_hours[$dayOfWeek] ?? null;
            if (!$workingHours || !($workingHours['active'] ?? $workingHours['is_open'] ?? false)) {
                $dayStatus[$dayKey] = 'closed';
                continue;
            }
            
            // Check if entire date is blocked
            $isDateBlocked = $this->isDateBlocked($establishment, $date);
            if ($isDateBlocked) {
                $dayStatus[$dayKey] = 'blocked';
                continue;
            }
            
            // Check if there are any available time slots for this day
            $timeSlots = $this->generateAvailableTimeSlots($establishment, $service, $dayKey);
            $hasAvailableSlots = collect($timeSlots)->where('status', 'available')->count() > 0;
            
            $dayStatus[$dayKey] = $hasAvailableSlots ? 'available' : 'unavailable';
        }
        
        return $dayStatus;
    }

    private function calculateEarliestBookingDate($establishment)
    {
        $today = Carbon::today();
        $earliestSetting = $establishment->earliest_booking_time;

        if (!$earliestSetting || $earliestSetting === 'same_day') {
            return $today; // Allow same day booking if no restriction
        }

        switch ($earliestSetting) {
            case '+1 day':
                return $today->copy()->addDay();
            case '+2 days':
                return $today->copy()->addDays(2);
            case '+3 days':
                return $today->copy()->addDays(3);
            case '+7 days':
                return $today->copy()->addWeek();
            case '+1 month':
                return $today->copy()->addMonth();
            case 'next_week':
                // Next Monday
                return $today->copy()->next(Carbon::MONDAY);
            case 'next_month':
                // First day of next month
                return $today->copy()->firstOfMonth()->addMonth();
            default:
                return $today;
        }
    }

    private function calculateLatestBookingDate($establishment)
    {
        $today = Carbon::today();
        $latestSetting = $establishment->latest_booking_time;

        if (!$latestSetting || $latestSetting === 'no_limit') {
            return null; // No limit
        }

        switch ($latestSetting) {
            case '+1 week':
                return $today->copy()->addWeek();
            case '+2 weeks':
                return $today->copy()->addWeeks(2);
            case '+1 month':
                return $today->copy()->addMonth();
            case '+2 months':
                return $today->copy()->addMonths(2);
            case '+3 months':
                return $today->copy()->addMonths(3);
            case '+6 months':
                return $today->copy()->addMonths(6);
            default:
                return null;
        }
    }
}