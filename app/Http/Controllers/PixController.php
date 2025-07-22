<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Establishment;
use App\Services\WitetecService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PixController extends Controller
{
    private WitetecService $witetecService;

    public function __construct(WitetecService $witetecService)
    {
        $this->witetecService = $witetecService;
    }

    /**
     * Create a new PIX transaction
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:5',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_document_type' => 'required|in:CPF,CNPJ',
            'customer_document' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.title' => 'required|string|max:255',
            'items.*.amount' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.tangible' => 'required|boolean',
            'items.*.external_ref' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $establishment = Auth::user()->establishment;
        if (!$establishment) {
            return response()->json([
                'success' => false,
                'message' => 'Estabelecimento não encontrado'
            ], 404);
        }

        // Validate amount
        if (!WitetecService::isValidAmount($request->amount)) {
            return response()->json([
                'success' => false,
                'message' => 'Valor mínimo é R$ 5,00'
            ], 422);
        }

        // Validate PIX key
        if (!WitetecService::isValidPixKey($request->customer_document, $request->customer_document_type)) {
            return response()->json([
                'success' => false,
                'message' => 'Documento inválido para PIX'
            ], 422);
        }

        try {
            // Create local transaction first
            $transaction = Transaction::create([
                'external_id' => Str::uuid(),
                'establishment_id' => $establishment->id,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'amount' => $request->amount,
                'type' => 'service_payment',
                'description' => 'Pagamento via PIX',
                'payment_method' => 'PIX',
                'status' => 'pending',
            ]);

            // Calculate commission
            $commissionPercentage = $establishment->plan->commission_percentage ?? 5.0;
            $transaction->calculateCommission($commissionPercentage);

            // Prepare data for Witetec API
            $witetecData = [
                'amount' => WitetecService::formatAmountToCentavos($request->amount),
                'method' => 'PIX',
                'metadata' => array_merge(
                    $request->metadata ?? [],
                    ['establishment_id' => $establishment->id, 'transaction_id' => $transaction->id]
                ),
                'customer' => [
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => preg_replace('/[^0-9]/', '', $request->customer_phone),
                    'documentType' => $request->customer_document_type,
                    'document' => preg_replace('/[^0-9]/', '', $request->customer_document),
                ],
                'items' => collect($request->items)->map(function ($item) {
                    return [
                        'title' => $item['title'],
                        'amount' => WitetecService::formatAmountToCentavos($item['amount']),
                        'quantity' => $item['quantity'],
                        'tangible' => $item['tangible'],
                        'externalRef' => $item['external_ref'] ?? null,
                    ];
                })->toArray(),
            ];

            // Create PIX transaction with Witetec
            $response = $this->witetecService->createPixTransaction($witetecData);

            if (!$response || !$response['status']) {
                $transaction->update(['status' => 'cancelled']);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao criar transação PIX'
                ], 500);
            }

            $pixData = $response['data'];

            // Update transaction with Witetec data
            $transaction->update([
                'external_id' => $pixData['id'],
                'status' => 'waiting_payment',
                'pix_txid' => $pixData['pix']['id'] ?? null,
                'pix_qr_code' => $pixData['pix']['qrcodeUrl'] ?? null,
                'pix_qr_code_text' => $pixData['pix']['qrcode'] ?? null,
                'expires_at' => $pixData['pix']['expirationDate'] ? now()->parse($pixData['pix']['expirationDate']) : null,
                'witetec_data' => $pixData,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transação PIX criada com sucesso',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'external_id' => $transaction->external_id,
                    'amount' => $transaction->amount,
                    'status' => $transaction->status,
                    'qr_code' => $transaction->pix_qr_code,
                    'qr_code_text' => $transaction->pix_qr_code_text,
                    'expires_at' => $transaction->expires_at,
                ]
            ]);

        } catch (\Exception $e) {
            if (isset($transaction)) {
                $transaction->update(['status' => 'cancelled']);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erro interno do servidor',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get transaction status
     */
    public function status(Transaction $transaction): JsonResponse
    {
        $this->authorize('view', $transaction);

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_id' => $transaction->id,
                'external_id' => $transaction->external_id,
                'status' => $transaction->status,
                'amount' => $transaction->amount,
                'customer_name' => $transaction->customer_name,
                'customer_email' => $transaction->customer_email,
                'created_at' => $transaction->created_at,
                'expires_at' => $transaction->expires_at,
                'approved_at' => $transaction->approved_at,
            ]
        ]);
    }

    /**
     * Cancel a PIX transaction
     */
    public function cancel(Transaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);

        if (!in_array($transaction->status, ['pending', 'waiting_payment'])) {
            return response()->json([
                'success' => false,
                'message' => 'Transação não pode ser cancelada'
            ], 422);
        }

        $transaction->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Transação cancelada com sucesso'
        ]);
    }

    /**
     * List PIX transactions for establishment
     */
    public function index(Request $request): JsonResponse
    {
        $establishment = Auth::user()->establishment;
        
        $transactions = Transaction::where('establishment_id', $establishment->id)
            ->where('payment_method', 'PIX')
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->from_date, function ($query, $date) {
                return $query->whereDate('created_at', '>=', $date);
            })
            ->when($request->to_date, function ($query, $date) {
                return $query->whereDate('created_at', '<=', $date);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}