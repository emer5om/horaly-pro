<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        // Usar relacionamento many-to-many para buscar customers do estabelecimento
        $query = $establishment->customers();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('list_type')) {
            $query->where('list_type', $request->list_type);
        }

        if ($request->filled('is_blocked')) {
            $query->where('is_blocked', $request->is_blocked === 'true');
        }

        $customers = $query->latest('customer_establishments.created_at')->paginate(10);

        $stats = [
            'total' => $establishment->customers()->count(),
            'active' => $establishment->customers()->where('is_blocked', false)->count(),
            'blocked' => $establishment->customers()->where('is_blocked', true)->count(),
            'vip' => $establishment->customers()->where('list_type', 'vip')->count(),
        ];

        return Inertia::render('establishment/customers/Index', [
            'customers' => $customers,
            'stats' => $stats,
            'filters' => $request->only(['search', 'list_type', 'is_blocked']),
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function create()
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/customers/Create', [
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function store(Request $request)
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        $request->validate([
            'name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:customers',
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'list_type' => 'nullable|in:regular,vip,priority',
            'is_blocked' => 'boolean',
        ]);

        $customerData = $request->all();
        $customerData['list_type'] = $customerData['list_type'] ?? 'regular';
        
        // Remover establishment_id dos dados se existir
        unset($customerData['establishment_id']);

        // Buscar cliente existente por telefone (se informado) ou email
        $customer = null;
        if (!empty($customerData['phone'])) {
            $customer = Customer::where('phone', $customerData['phone'])->first();
        } elseif (!empty($customerData['email'])) {
            $customer = Customer::where('email', $customerData['email'])->first();
        }
        
        if ($customer) {
            // Atualizar dados do cliente existente
            $customer->update($customerData);
            
            // Associar ao estabelecimento se ainda não estiver associado
            if (!$customer->establishments()->where('establishment_id', $establishment->id)->exists()) {
                $customer->establishments()->attach($establishment->id);
            }
        } else {
            // Criar novo cliente
            $customer = Customer::create($customerData);
            
            // Associar ao estabelecimento
            $customer->establishments()->attach($establishment->id);
        }

        // Check if this is an AJAX request (from appointment creation)
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'customer' => $customer,
                'message' => 'Cliente criado com sucesso!'
            ]);
        }

        return redirect()->route('customers.index')
            ->with('flash', ['success' => 'Cliente criado com sucesso!']);
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);
        
        $customer->load(['appointments.service']);

        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/customers/Show', [
            'customer' => $customer,
            'recentAppointments' => $customer->appointments()->with('service')->orderBy('scheduled_at', 'desc')->limit(10)->get(),
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function edit(Customer $customer)
    {
        $this->authorize('update', $customer);
        
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/customers/Edit', [
            'customer' => $customer,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $this->authorize('update', $customer);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers')->ignore($customer->id),
            ],
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'list_type' => 'required|in:regular,vip,priority',
            'is_blocked' => 'boolean',
        ]);

        $customer->update($request->all());

        return redirect()->route('customers.index')
            ->with('flash', ['success' => 'Cliente atualizado com sucesso!']);
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);
        
        if ($customer->appointments()->exists()) {
            return redirect()->route('customers.index')
                ->with('flash', ['error' => 'Não é possível excluir um cliente com agendamentos.']);
        }

        $customer->delete();

        return redirect()->route('customers.index')
            ->with('flash', ['success' => 'Cliente excluído com sucesso!']);
    }

    public function search(Request $request)
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        $query = $request->get('q', '');
        
        if (empty($query) || strlen($query) < 2) {
            return response()->json([]);
        }

        $customers = Customer::where('establishment_id', $establishment->id)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%")
                  ->orWhereRaw("CONCAT(name, ' ', COALESCE(last_name, '')) LIKE ?", ["%{$query}%"]);
            })
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'last_name' => $customer->last_name,
                    'full_name' => trim($customer->name . ' ' . ($customer->last_name ?? '')),
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ];
            });

        return response()->json($customers);
    }
}