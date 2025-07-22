<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WitetecService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.witetec.base_url', 'https://api.witetec.net');
        $this->apiKey = config('services.witetec.api_key');
    }

    /**
     * Create a PIX transaction
     *
     * @param array $data Transaction data
     * @return array|null Response data or null on failure
     */
    public function createPixTransaction(array $data): ?array
    {
        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/transactions', $data);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Witetec API Error', [
                'status' => $response->status(),
                'response' => $response->body(),
                'request_data' => $data
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Witetec Service Exception', [
                'message' => $e->getMessage(),
                'request_data' => $data
            ]);

            return null;
        }
    }

    /**
     * Format amount from reais to centavos
     *
     * @param float $amount Amount in reais
     * @return int Amount in centavos
     */
    public static function formatAmountToCentavos(float $amount): int
    {
        return (int) round($amount * 100);
    }

    /**
     * Format amount from centavos to reais
     *
     * @param int $amount Amount in centavos
     * @return float Amount in reais
     */
    public static function formatAmountToReais(int $amount): float
    {
        return $amount / 100;
    }

    /**
     * Validate if amount meets minimum requirement (R$ 5.00)
     *
     * @param float $amount Amount in reais
     * @return bool
     */
    public static function isValidAmount(float $amount): bool
    {
        return $amount >= 5.00;
    }

    /**
     * Validate PIX key format (CPF or CNPJ)
     *
     * @param string $document Document number
     * @param string $documentType Document type (CPF or CNPJ)
     * @return bool
     */
    public static function isValidPixKey(string $document, string $documentType): bool
    {
        $document = preg_replace('/[^0-9]/', '', $document);

        if ($documentType === 'CPF') {
            return strlen($document) === 11 && self::validateCpf($document);
        }

        if ($documentType === 'CNPJ') {
            return strlen($document) === 14 && self::validateCnpj($document);
        }

        return false;
    }

    /**
     * Validate CPF
     *
     * @param string $cpf
     * @return bool
     */
    private static function validateCpf(string $cpf): bool
    {
        if (strlen($cpf) !== 11 || preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validate CNPJ
     *
     * @param string $cnpj
     * @return bool
     */
    private static function validateCnpj(string $cnpj): bool
    {
        if (strlen($cnpj) !== 14) {
            return false;
        }

        $weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += $cnpj[$i] * $weights1[$i];
        }

        $digit1 = ($sum % 11) < 2 ? 0 : 11 - ($sum % 11);

        if ($cnpj[12] != $digit1) {
            return false;
        }

        $sum = 0;
        for ($i = 0; $i < 13; $i++) {
            $sum += $cnpj[$i] * $weights2[$i];
        }

        $digit2 = ($sum % 11) < 2 ? 0 : 11 - ($sum % 11);

        return $cnpj[13] == $digit2;
    }
}