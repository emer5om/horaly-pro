<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Establishment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BookingLinkController extends Controller
{
    public function index()
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        if (!$establishment) {
            return redirect()->route('dashboard')->with('error', 'Estabelecimento não encontrado.');
        }
        
        return Inertia::render('establishment/settings/booking-link', [
            'establishment' => $establishment,
            'themes' => $this->getAvailableThemes(),
            'defaultRequiredFields' => $this->getDefaultRequiredFields(),
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function update(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        if (!$establishment) {
            return redirect()->back()->withErrors(['error' => 'Estabelecimento não encontrado.']);
        }

        $validated = $request->validate([
            'booking_slug' => 'required|string|max:255|regex:/^[a-z0-9-]+$/|unique:establishments,booking_slug,' . $establishment->id,
            'booking_primary_color' => 'required|string|max:7',
            'booking_secondary_color' => 'required|string|max:7',
            'booking_slogan' => 'nullable|string|max:255',
            'booking_theme' => 'required|string|in:modern,classic,minimal,colorful',
            'required_fields' => 'nullable|array',
            'required_fields.*' => 'string|in:name,phone,email,last_name,birth_date',
        ]);
        
        // Garantir que nome e telefone sempre estejam incluídos
        $requiredFields = array_merge(['name', 'phone'], $validated['required_fields'] ?? []);
        
        $establishment->update([
            'booking_slug' => Str::slug($validated['booking_slug']),
            'booking_primary_color' => $validated['booking_primary_color'],
            'booking_secondary_color' => $validated['booking_secondary_color'],
            'booking_slogan' => $validated['booking_slogan'],
            'booking_theme' => $validated['booking_theme'],
            'required_fields' => array_values(array_unique($requiredFields)),
        ]);

        return redirect()->back()->with('flash', ['success' => 'Configurações do link de agendamento atualizadas com sucesso!']);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $establishment = auth()->user()->establishment;
        
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('establishments/logos', 'public');
            $establishment->update(['booking_logo' => $path]);
        }

        return redirect()->back()->with('flash', ['success' => 'Logo atualizado com sucesso!']);
    }

    public function uploadBanner(Request $request)
    {
        $request->validate([
            'banner' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $establishment = auth()->user()->establishment;
        
        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store('establishments/banners', 'public');
            $establishment->update(['booking_banner' => $path]);
        }

        return redirect()->back()->with('flash', ['success' => 'Banner atualizado com sucesso!']);
    }

    private function getAvailableThemes()
    {
        return [
            'modern' => 'Moderno',
            'classic' => 'Clássico',
            'minimal' => 'Minimalista',
            'colorful' => 'Colorido',
        ];
    }

    private function getDefaultRequiredFields()
    {
        return [
            'name' => [
                'label' => 'Nome',
                'required' => true,
                'disabled' => true,
            ],
            'phone' => [
                'label' => 'Telefone',
                'required' => true,
                'disabled' => true,
            ],
            'email' => [
                'label' => 'Email',
                'required' => false,
                'disabled' => false,
            ],
            'last_name' => [
                'label' => 'Sobrenome',
                'required' => false,
                'disabled' => false,
            ],
            'birth_date' => [
                'label' => 'Data de Nascimento',
                'required' => false,
                'disabled' => false,
            ],
        ];
    }
}