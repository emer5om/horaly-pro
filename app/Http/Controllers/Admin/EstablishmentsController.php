<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Establishment;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EstablishmentsController extends Controller
{
    /**
     * Display a listing of establishments.
     */
    public function index(Request $request): Response
    {
        $query = Establishment::with(['plan', 'user']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by plan
        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->plan_id);
        }

        $establishments = $query->latest()->paginate(15);

        // Get plans for filter dropdown
        $plans = Plan::where('is_active', true)->get();

        return Inertia::render('admin/establishments/index', [
            'establishments' => $establishments,
            'plans' => $plans,
            'filters' => $request->only(['search', 'status', 'plan_id']),
        ]);
    }

    /**
     * Show the form for creating a new establishment.
     */
    public function create(): Response
    {
        $plans = Plan::where('is_active', true)->get();

        return Inertia::render('admin/establishments/create', [
            'plans' => $plans,
        ]);
    }

    /**
     * Store a newly created establishment in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:establishments,email|unique:users,email',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:50',
            'postal_code' => 'required|string|max:20',
            'plan_id' => 'required|exists:plans,id',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive,blocked',
            'user_name' => 'required|string|max:255',
            'user_password' => 'required|string|min:8',
        ]);

        DB::beginTransaction();
        
        try {
            // Create user first
            $user = User::create([
                'name' => $validated['user_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['user_password']),
                'role' => 'establishment',
                'email_verified_at' => now(), // Auto-verify admin created accounts
            ]);

            // Generate unique slug
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (Establishment::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Create establishment
            $establishment = Establishment::create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'city' => $validated['city'],
                'state' => $validated['state'],
                'postal_code' => $validated['postal_code'],
                'plan_id' => $validated['plan_id'],
                'description' => $validated['description'],
                'status' => $validated['status'],
                'slug' => $slug,
            ]);

            DB::commit();

            return redirect()->route('admin.establishments.index')
                ->with('success', 'Estabelecimento e usuário criados com sucesso!');
                
        } catch (\Exception $e) {
            DB::rollback();
            
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Erro ao criar estabelecimento: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified establishment.
     */
    public function show(Establishment $establishment): Response
    {
        $establishment->load(['plan', 'user', 'services', 'appointments.customer']);

        // Get statistics
        $stats = [
            'total_services' => $establishment->services->count(),
            'total_appointments' => $establishment->appointments->count(),
            'pending_appointments' => $establishment->appointments->where('status', 'pending')->count(),
            'completed_appointments' => $establishment->appointments->where('status', 'completed')->count(),
            'total_revenue' => $establishment->appointments
                ->where('status', 'completed')
                ->sum(function ($appointment) {
                    return $appointment->price - $appointment->discount_amount;
                }),
        ];

        return Inertia::render('admin/establishments/show', [
            'establishment' => $establishment,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for editing the specified establishment.
     */
    public function edit(Establishment $establishment): Response
    {
        $plans = Plan::where('is_active', true)->get();

        return Inertia::render('admin/establishments/edit', [
            'establishment' => $establishment->load('plan'),
            'plans' => $plans,
        ]);
    }

    /**
     * Update the specified establishment in storage.
     */
    public function update(Request $request, Establishment $establishment)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('establishments')->ignore($establishment->id),
            ],
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:50',
            'postal_code' => 'required|string|max:20',
            'plan_id' => 'required|exists:plans,id',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive,blocked',
        ]);

        // Update slug if name changed
        if ($validated['name'] !== $establishment->name) {
            $validated['slug'] = Str::slug($validated['name']);
            
            // Ensure unique slug
            $originalSlug = $validated['slug'];
            $counter = 1;
            while (Establishment::where('slug', $validated['slug'])
                ->where('id', '!=', $establishment->id)
                ->exists()) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        $establishment->update($validated);

        return redirect()->route('admin.establishments.index')
            ->with('success', 'Estabelecimento atualizado com sucesso!');
    }

    /**
     * Remove the specified establishment from storage.
     */
    public function destroy(Establishment $establishment)
    {
        // Check if establishment has appointments
        if ($establishment->appointments()->exists()) {
            return redirect()->route('admin.establishments.index')
                ->with('error', 'Não é possível excluir um estabelecimento com agendamentos.');
        }

        // Delete related data
        $establishment->services()->delete();
        $establishment->customers()->delete();
        
        // Delete the establishment
        $establishment->delete();

        return redirect()->route('admin.establishments.index')
            ->with('success', 'Estabelecimento excluído com sucesso!');
    }

    /**
     * Block/unblock the specified establishment.
     */
    public function toggleBlock(Establishment $establishment)
    {
        $newStatus = $establishment->status === 'blocked' ? 'active' : 'blocked';
        
        $establishment->update(['status' => $newStatus]);

        $message = $newStatus === 'blocked' 
            ? 'Estabelecimento bloqueado com sucesso!' 
            : 'Estabelecimento desbloqueado com sucesso!';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Change the plan of the specified establishment.
     */
    public function changePlan(Request $request, Establishment $establishment)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $establishment->update(['plan_id' => $validated['plan_id']]);

        return redirect()->back()->with('success', 'Plano alterado com sucesso!');
    }
}