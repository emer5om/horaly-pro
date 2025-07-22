<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Remover campos específicos do MercadoPago
            $table->dropColumn('mercadopago_data');
            
            // Adicionar campos específicos da Witetec PIX
            $table->string('pix_txid')->nullable()->after('external_id'); // TXID do PIX
            $table->text('pix_qr_code')->nullable()->after('pix_txid'); // QR Code PIX em base64
            $table->string('pix_qr_code_text')->nullable()->after('pix_qr_code'); // Texto do QR Code PIX
            $table->json('witetec_data')->nullable()->after('payment_method'); // Dados completos da Witetec
            $table->timestamp('expires_at')->nullable()->after('approved_at'); // Expiração do PIX
            
            // Atualizar status para incluir status específicos do PIX
            $table->dropColumn('status');
        });
        
        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 
                'waiting_payment', 
                'paid', 
                'expired', 
                'cancelled', 
                'refunded',
                'processing_refund'
            ])->default('pending')->after('commission_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Reverter mudanças
            $table->dropColumn([
                'pix_txid', 
                'pix_qr_code', 
                'pix_qr_code_text', 
                'witetec_data', 
                'expires_at'
            ]);
            
            $table->dropColumn('status');
        });
        
        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 
                'approved', 
                'authorized', 
                'in_process', 
                'in_mediation', 
                'rejected', 
                'cancelled', 
                'refunded', 
                'charged_back'
            ])->default('pending');
            
            $table->json('mercadopago_data')->nullable();
        });
    }
};
