<?php

namespace App\Http\Controllers;

use App\Models\Establishment;
use App\Services\MercadoPagoService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EstablishmentSettingsController extends Controller
{
    public function index()
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/settings/Index', [
            'establishment' => $establishment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function updateGeneral(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('establishments')->ignore($establishment->id),
            ],
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'booking_slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('establishments')->ignore($establishment->id),
            ],
            'description' => 'nullable|string',
            'slogan' => 'nullable|string|max:255',
        ]);

        $establishment->update($request->only([
            'name',
            'email',
            'phone',
            'address',
            'booking_slug',
            'description',
            'slogan',
        ]));

        return back()->with('flash', ['success' => 'Configurações gerais atualizadas com sucesso!']);
    }

    public function updateAppearance(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $request->validate([
            'theme' => 'required|string|in:default,modern,elegant,minimal',
            'colors' => 'nullable|array',
            'colors.primary' => 'nullable|string',
            'colors.secondary' => 'nullable|string',
            'colors.accent' => 'nullable|string',
        ]);

        $establishment->update([
            'theme' => $request->theme,
            'colors' => $request->colors,
        ]);

        return back()->with('flash', ['success' => 'Configurações de aparência atualizadas com sucesso!']);
    }

    public function updateWorkingHours(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $request->validate([
            'working_hours' => 'required|array',
            'working_hours.*.day' => 'required|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'working_hours.*.enabled' => 'required|boolean',
            'working_hours.*.start_time' => 'nullable|string',
            'working_hours.*.end_time' => 'nullable|string',
        ]);

        $establishment->update([
            'working_hours' => $request->working_hours,
        ]);

        return back()->with('flash', ['success' => 'Horários de funcionamento atualizados com sucesso!']);
    }

    public function updateBookingSettings(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $request->validate([
            'allow_rescheduling' => 'required|boolean',
            'allow_cancellation' => 'required|boolean',
            'reschedule_advance_hours' => 'required|integer|min:1',
            'cancel_advance_hours' => 'required|integer|min:1',
            'slots_per_hour' => 'required|integer|min:1|max:12',
        ]);

        $establishment->update($request->only([
            'allow_rescheduling',
            'allow_cancellation',
            'reschedule_advance_hours',
            'cancel_advance_hours',
            'slots_per_hour',
        ]));

        return back()->with('flash', ['success' => 'Configurações de agendamento atualizadas com sucesso!']);
    }

    public function updatePaymentSettings(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $validated = $request->validate([
            'mercadopago_access_token' => 'nullable|string',
            'accepted_payment_methods' => 'nullable|array',
            'accepted_payment_methods.*' => 'string|in:pix',
            'booking_fee_enabled' => 'required|boolean',
            'booking_fee_type' => 'required|string|in:fixed,percentage',
            'booking_fee_amount' => 'required_if:booking_fee_type,fixed|numeric|min:0',
            'booking_fee_percentage' => 'required_if:booking_fee_type,percentage|numeric|min:0|max:100',
        ]);

        // Se booking_fee_enabled for false, não precisa validar métodos de pagamento
        if (!$validated['booking_fee_enabled']) {
            $validated['accepted_payment_methods'] = [];
        }

        // Se booking_fee_enabled for true e MercadoPago configurado, garantir que pelo menos um método seja selecionado
        if ($validated['booking_fee_enabled'] && $validated['mercadopago_access_token'] && empty($validated['accepted_payment_methods'])) {
            return back()->withErrors([
                'accepted_payment_methods' => 'Selecione pelo menos um método de pagamento quando a taxa de agendamento estiver ativada.'
            ]);
        }

        $establishment->update($validated);

        return back()->with('flash', ['success' => 'Configurações de pagamento atualizadas com sucesso!']);
    }

    public function updateIntegrations(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $request->validate([
            'whatsapp_instance_id' => 'nullable|string',
            'facebook_pixel_id' => 'nullable|string',
            'google_analytics_id' => 'nullable|string',
            'google_tag_id' => 'nullable|string',
        ]);

        $establishment->update($request->only([
            'whatsapp_instance_id',
            'facebook_pixel_id',
            'google_analytics_id',
            'google_tag_id',
        ]));

        return back()->with('flash', ['success' => 'Configurações de integrações atualizadas com sucesso!']);
    }

    public function checkSlugAvailability(Request $request)
    {
        $slug = $request->booking_slug;
        $establishment = auth()->user()->establishment;

        $available = !Establishment::where('booking_slug', $slug)
            ->where('id', '!=', $establishment->id)
            ->exists();

        return response()->json([
            'available' => $available,
            'booking_slug' => $slug,
        ]);
    }

    public function validateMercadoPagoToken(Request $request): JsonResponse
    {
        $request->validate([
            'access_token' => 'required|string',
        ]);

        $mercadoPagoService = new MercadoPagoService($request->access_token);
        
        if ($mercadoPagoService->validateAccessToken()) {
            return response()->json([
                'valid' => true,
                'message' => 'Access token válido',
            ]);
        }

        return response()->json([
            'valid' => false,
            'message' => 'Access token inválido',
        ], 422);
    }
}