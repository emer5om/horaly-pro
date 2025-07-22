<?php

namespace App\Http\Controllers;

use App\Models\Establishment;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $establishment = Establishment::with('plan')->where('user_id', Auth::id())->first();
        
        if (!$establishment) {
            return Inertia::render('establishment/onboarding');
        }

        $services = Service::where('establishment_id', $establishment->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('establishment/services/index', [
            'services' => $services,
            'establishment' => $establishment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $establishment = Establishment::with('plan')->where('user_id', Auth::id())->first();
        
        if (!$establishment) {
            return Inertia::render('establishment/onboarding');
        }

        return Inertia::render('establishment/services/create', [
            'establishment' => $establishment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $establishment = Establishment::where('user_id', Auth::id())->first();
        
        if (!$establishment) {
            return redirect()->route('dashboard');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'has_promotion' => 'boolean',
            'promotion_price' => 'nullable|numeric|min:0|lt:price',
            'allow_rescheduling' => 'boolean',
            'allow_cancellation' => 'boolean',
            'is_active' => 'boolean',
        ]);

        Service::create([
            'establishment_id' => $establishment->id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'duration_minutes' => $request->duration_minutes,
            'has_promotion' => $request->boolean('has_promotion', false),
            'promotion_price' => $request->has_promotion ? $request->promotion_price : null,
            'allow_rescheduling' => $request->boolean('allow_rescheduling', true),
            'allow_cancellation' => $request->boolean('allow_cancellation', true),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('services.index')
            ->with('flash', ['success' => 'Serviço criado com sucesso!']);
    }

    /**
     * Display the specified resource.
     */
    public function show(Service $service): Response
    {
        $establishment = Establishment::with('plan')->where('user_id', Auth::id())->first();
        
        // Verificar se o serviço pertence ao estabelecimento do usuário
        if (!$establishment || $service->establishment_id !== $establishment->id) {
            abort(403);
        }

        return Inertia::render('establishment/services/show', [
            'service' => $service,
            'establishment' => $establishment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Service $service): Response
    {
        $establishment = Establishment::with('plan')->where('user_id', Auth::id())->first();
        
        // Verificar se o serviço pertence ao estabelecimento do usuário
        if (!$establishment || $service->establishment_id !== $establishment->id) {
            abort(403);
        }

        return Inertia::render('establishment/services/edit', [
            'service' => $service,
            'establishment' => $establishment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Service $service): RedirectResponse
    {
        $establishment = Establishment::where('user_id', Auth::id())->first();
        
        // Verificar se o serviço pertence ao estabelecimento do usuário
        if (!$establishment || $service->establishment_id !== $establishment->id) {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'has_promotion' => 'boolean',
            'promotion_price' => 'nullable|numeric|min:0|lt:price',
            'allow_rescheduling' => 'boolean',
            'allow_cancellation' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $service->update([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'duration_minutes' => $request->duration_minutes,
            'has_promotion' => $request->boolean('has_promotion', false),
            'promotion_price' => $request->has_promotion ? $request->promotion_price : null,
            'allow_rescheduling' => $request->boolean('allow_rescheduling', true),
            'allow_cancellation' => $request->boolean('allow_cancellation', true),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('services.index')
            ->with('flash', ['success' => 'Serviço atualizado com sucesso!']);
    }

    /**
     * Toggle service status
     */
    public function toggle(Request $request, Service $service): RedirectResponse
    {
        $establishment = Establishment::where('user_id', Auth::id())->first();
        
        // Verificar se o serviço pertence ao estabelecimento do usuário
        if (!$establishment || $service->establishment_id !== $establishment->id) {
            abort(403);
        }

        $service->update([
            'is_active' => $request->boolean('is_active')
        ]);

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $service): RedirectResponse
    {
        $establishment = Establishment::where('user_id', Auth::id())->first();
        
        // Verificar se o serviço pertence ao estabelecimento do usuário
        if (!$establishment || $service->establishment_id !== $establishment->id) {
            abort(403);
        }

        $service->delete();

        return redirect()->route('services.index')
            ->with('flash', ['success' => 'Serviço excluído com sucesso!']);
    }
}
