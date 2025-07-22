<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Transaction;
use App\Services\WitetecService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BookingFeeController extends Controller
{
    private WitetecService $witetecService;

    public function __construct(WitetecService $witetecService)
    {
        $this->witetecService = $witetecService;
    }

    /**
     * Create PIX transaction for booking fee
     */
    public function createPixPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_document_type' => 'required|in:CPF,CNPJ',
            'customer_document' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $appointment = Appointment::with(['establishment', 'service'])->findOrFail($request->appointment_id);

        // Verify if establishment has booking fee enabled
        if (!$appointment->establishment->booking_fee_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Taxa de agendamento não habilitada para este estabelecimento'
            ], 422);
        }

        // Check if fee is already paid
        if ($appointment->booking_fee_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Taxa de agendamento já foi paga'
            ], 422);
        }

        // Calculate booking fee
        $feeAmount = $this->calculateBookingFee($appointment);

        // Validate minimum amount
        if (!WitetecService::isValidAmount($feeAmount)) {
            return response()->json([
                'success' => false,
                'message' => 'Valor da taxa de agendamento muito baixo (mínimo R$ 5,00)'
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
            // Create transaction
            $transaction = Transaction::create([
                'external_id' => Str::uuid(),
                'establishment_id' => $appointment->establishment_id,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'amount' => $feeAmount,
                'type' => 'booking_fee',
                'description' => "Taxa de agendamento - {$appointment->service->name}",
                'payment_method' => 'PIX',
                'status' => 'pending',
            ]);

            // Calculate commission
            $commissionPercentage = $appointment->establishment->plan->commission_percentage ?? 5.0;
            $transaction->calculateCommission($commissionPercentage);

            // Prepare data for Witetec API
            $witetecData = [
                'amount' => WitetecService::formatAmountToCentavos($feeAmount),
                'method' => 'PIX',
                'metadata' => [
                    'appointment_id' => $appointment->id,
                    'establishment_id' => $appointment->establishment_id,
                    'transaction_type' => 'booking_fee'
                ],
                'customer' => [
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => preg_replace('/[^0-9]/', '', $request->customer_phone),
                    'documentType' => $request->customer_document_type,
                    'document' => preg_replace('/[^0-9]/', '', $request->customer_document),
                ],
                'items' => [
                    [
                        'title' => "Taxa de agendamento - {$appointment->service->name}",
                        'amount' => WitetecService::formatAmountToCentavos($feeAmount),
                        'quantity' => 1,
                        'tangible' => false,
                        'externalRef' => "booking_fee_{$appointment->id}",
                    ]
                ],
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

            // Update appointment
            $appointment->update([
                'booking_fee_amount' => $feeAmount,
                'booking_fee_transaction_id' => $transaction->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'PIX gerado com sucesso',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'appointment_id' => $appointment->id,
                    'amount' => $feeAmount,
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
     * Get booking fee information for appointment
     */
    public function getBookingFeeInfo(Appointment $appointment): JsonResponse
    {
        if (!$appointment->establishment->booking_fee_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Taxa de agendamento não habilitada'
            ], 422);
        }

        $feeAmount = $this->calculateBookingFee($appointment);

        return response()->json([
            'success' => true,
            'data' => [
                'appointment_id' => $appointment->id,
                'fee_enabled' => true,
                'fee_type' => $appointment->establishment->booking_fee_type,
                'fee_amount' => $feeAmount,
                'fee_status' => $appointment->booking_fee_status,
                'service_name' => $appointment->service->name,
                'service_price' => $appointment->service->final_price,
            ]
        ]);
    }

    /**
     * Check payment status
     */
    public function checkPaymentStatus(Transaction $transaction): JsonResponse
    {
        $appointment = Appointment::where('booking_fee_transaction_id', $transaction->id)->first();
        
        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Agendamento não encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_id' => $transaction->id,
                'appointment_id' => $appointment->id,
                'status' => $transaction->status,
                'amount' => $transaction->amount,
                'created_at' => $transaction->created_at,
                'expires_at' => $transaction->expires_at,
                'paid_at' => $transaction->approved_at,
            ]
        ]);
    }

    /**
     * Calculate booking fee amount
     */
    private function calculateBookingFee(Appointment $appointment): float
    {
        $establishment = $appointment->establishment;
        
        if ($establishment->booking_fee_type === 'fixed') {
            return (float) $establishment->booking_fee_amount;
        }
        
        // Percentage-based fee
        $servicePrice = $appointment->service->final_price;
        $percentage = $establishment->booking_fee_percentage;
        
        return round($servicePrice * ($percentage / 100), 2);
    }
}