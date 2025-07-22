<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlansController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = Plan::orderBy('created_at', 'desc')->get();

        return Inertia::render('admin/plans/index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('admin/plans/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,quarterly,yearly',
            'features' => 'array',
            'monthly_appointment_limit' => 'nullable|integer|min:1',
            'unlimited_appointments' => 'boolean',
            'is_active' => 'boolean',
        ]);

        Plan::create($request->all());

        return redirect()->route('admin.plans.index')->with('success', 'Plano criado com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Plan $plan)
    {
        $establishments = $plan->establishments()->with('user')->get();
        
        return Inertia::render('admin/plans/show', [
            'plan' => $plan,
            'establishments' => $establishments,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Plan $plan)
    {
        return Inertia::render('admin/plans/edit', [
            'plan' => $plan,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Plan $plan)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,quarterly,yearly',
            'features' => 'array',
            'monthly_appointment_limit' => 'nullable|integer|min:1',
            'unlimited_appointments' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $plan->update($request->all());

        return redirect()->route('admin.plans.index')->with('success', 'Plano atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Plan $plan)
    {
        // Check if plan has establishments
        if ($plan->establishments()->count() > 0) {
            return redirect()->route('admin.plans.index')->with('error', 'Não é possível excluir um plano que possui estabelecimentos vinculados.');
        }

        $plan->delete();

        return redirect()->route('admin.plans.index')->with('success', 'Plano excluído com sucesso!');
    }

    /**
     * Toggle plan active status
     */
    public function toggleStatus(Plan $plan)
    {
        $plan->update(['is_active' => !$plan->is_active]);

        $status = $plan->is_active ? 'ativado' : 'desativado';
        
        return redirect()->back()->with('success', "Plano {$status} com sucesso!");
    }

    /**
     * Show the permissions form for the specified plan
     */
    public function permissions(Plan $plan)
    {
        return Inertia::render('admin/plans/permissions', [
            'plan' => $plan,
        ]);
    }

    /**
     * Update the permissions for the specified plan
     */
    public function updatePermissions(Request $request, Plan $plan)
    {
        $request->validate([
            'features' => 'array',
        ]);

        $plan->update(['features' => $request->features ?? []]);

        return redirect()->route('admin.plans.index')->with('success', 'Permissões atualizadas com sucesso!');
    }
}