<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Display a listing of subscription transactions
     */
    public function index(Request $request)
    {
        $query = SubscriptionPayment::with(['establishment.user', 'plan'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('admin_status')) {
            $query->where('admin_status', $request->admin_status);
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->plan_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('establishment', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->paginate(20)->withQueryString();

        // Summary stats
        $totalPending = SubscriptionPayment::where('status', 'pending')->sum('amount');
        $totalApproved = SubscriptionPayment::where('status', 'approved')->sum('amount');
        $totalRejected = SubscriptionPayment::where('status', 'rejected')->sum('amount');
        $totalThisMonth = SubscriptionPayment::currentMonth()->sum('amount');

        return Inertia::render('admin/transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['status', 'admin_status', 'plan_id', 'search', 'date_from', 'date_to']),
            'stats' => [
                'total_pending' => $totalPending,
                'total_approved' => $totalApproved,
                'total_rejected' => $totalRejected,
                'total_this_month' => $totalThisMonth,
                'count_pending' => SubscriptionPayment::where('status', 'pending')->count(),
                'count_approved' => SubscriptionPayment::where('status', 'approved')->count(),
                'count_rejected' => SubscriptionPayment::where('status', 'rejected')->count(),
            ],
            'plans' => \App\Models\Plan::select('id', 'name')->get(),
        ]);
    }

    /**
     * Show transaction details
     */
    public function show(SubscriptionPayment $transaction)
    {
        $transaction->load(['establishment.user', 'plan']);

        return Inertia::render('admin/transactions/Show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Update transaction admin status and notes
     */
    public function update(Request $request, SubscriptionPayment $transaction)
    {
        $request->validate([
            'admin_status' => 'required|in:pending,verified,disputed,cancelled',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $transaction->update([
            'admin_status' => $request->admin_status,
            'admin_notes' => $request->admin_notes,
        ]);

        return back()->with('success', 'Transação atualizada com sucesso!');
    }

    /**
     * Export transactions to CSV
     */
    public function export(Request $request)
    {
        $query = SubscriptionPayment::with(['establishment.user', 'plan'])
            ->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('admin_status')) {
            $query->where('admin_status', $request->admin_status);
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->plan_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('establishment', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->get();

        $filename = 'transacoes_' . now()->format('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($transactions) {
            $file = fopen('php://output', 'w');
            
            // CSV headers
            fputcsv($file, [
                'ID',
                'Estabelecimento',
                'Email',
                'Plano',
                'Valor',
                'Status',
                'Status Admin',
                'MercadoPago ID',
                'Criado em',
                'Pago em',
                'Expira em',
                'Notas Admin'
            ]);

            foreach ($transactions as $transaction) {
                fputcsv($file, [
                    $transaction->id,
                    $transaction->establishment->name,
                    $transaction->establishment->user->email,
                    $transaction->plan->name,
                    $transaction->amount,
                    $transaction->status_label,
                    $transaction->admin_status_label,
                    $transaction->mercadopago_payment_id,
                    $transaction->created_at->format('d/m/Y H:i'),
                    $transaction->paid_at ? $transaction->paid_at->format('d/m/Y H:i') : '',
                    $transaction->expires_at ? $transaction->expires_at->format('d/m/Y H:i') : '',
                    $transaction->admin_notes ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}