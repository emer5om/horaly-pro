<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingPageSettings;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    /**
     * Display the landing page settings
     */
    public function index()
    {
        $defaultSettings = LandingPageSettings::getDefault();
        $settings = [];
        
        foreach ($defaultSettings as $key => $defaultValue) {
            $settings[$key] = LandingPageSettings::get($key, $defaultValue);
        }
        
        $plans = Plan::where('is_active', true)->orderBy('landing_order')->orderBy('price')->get();
        
        return Inertia::render('admin/landing-page/index', [
            'settings' => $settings,
            'plans' => $plans,
        ]);
    }

    /**
     * Update the landing page settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'hero_title' => 'required|string|max:255',
            'hero_subtitle' => 'required|string|max:255',
            'hero_description' => 'required|string|max:1000',
            'plans_title' => 'required|string|max:255',
            'plans_subtitle' => 'required|string|max:255',
            'plans_description' => 'required|string|max:1000',
            'contact_title' => 'nullable|string|max:255',
            'contact_subtitle' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:255',
            'contact_address' => 'nullable|string|max:255',
            'show_plans' => 'boolean',
            'show_contact' => 'boolean',
            'show_testimonials' => 'boolean',
            'primary_color' => 'required|string|max:7',
            'secondary_color' => 'required|string|max:7',
        ]);

        $settings = $request->only([
            'hero_title',
            'hero_subtitle',
            'hero_description',
            'plans_title',
            'plans_subtitle',
            'plans_description',
            'contact_title',
            'contact_subtitle',
            'contact_phone',
            'contact_email',
            'contact_address',
            'show_plans',
            'show_contact',
            'show_testimonials',
            'primary_color',
            'secondary_color',
        ]);

        foreach ($settings as $key => $value) {
            LandingPageSettings::set($key, $value);
        }

        return redirect()->back()->with('success', 'Configurações da landing page atualizadas com sucesso!');
    }

    /**
     * Update plans visibility and order
     */
    public function updatePlansVisibility(Request $request)
    {
        $request->validate([
            'visible_plans' => 'array',
            'visible_plans.*' => 'integer|exists:plans,id',
            'plan_order' => 'array',
            'plan_order.*' => 'integer|exists:plans,id',
        ]);

        // Store visible plans
        LandingPageSettings::set('visible_plans', $request->visible_plans ?? []);
        
        // Store plans order
        LandingPageSettings::set('plans_order', $request->plan_order ?? []);

        return redirect()->back()->with('success', 'Visibilidade dos planos atualizada com sucesso!');
    }

    /**
     * Update a specific plan's landing page settings
     */
    public function updatePlan(Request $request, Plan $plan)
    {
        $request->validate([
            'landing_title' => 'nullable|string|max:255',
            'landing_description' => 'nullable|string|max:1000',
            'landing_features' => 'nullable|array',
            'landing_features.*' => 'string|max:255',
            'landing_button_text' => 'nullable|string|max:50',
            'landing_badge' => 'nullable|string|max:50',
            'landing_featured' => 'boolean',
            'landing_order' => 'nullable|integer|min:0',
            'show_on_landing' => 'boolean',
        ]);

        $plan->update($request->only([
            'landing_title',
            'landing_description',
            'landing_features',
            'landing_button_text',
            'landing_badge',
            'landing_featured',
            'landing_order',
            'show_on_landing',
        ]));

        return redirect()->back()->with('success', 'Configurações do plano atualizadas com sucesso!');
    }

    /**
     * Update plans order
     */
    public function updatePlansOrder(Request $request)
    {
        $request->validate([
            'plans' => 'required|array',
            'plans.*.id' => 'required|integer|exists:plans,id',
            'plans.*.order' => 'required|integer|min:0',
        ]);

        foreach ($request->plans as $planData) {
            Plan::where('id', $planData['id'])->update([
                'landing_order' => $planData['order']
            ]);
        }

        return redirect()->back()->with('success', 'Ordem dos planos atualizada com sucesso!');
    }
}
