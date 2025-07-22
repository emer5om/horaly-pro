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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique(); // ID do MercadoPago
            $table->foreignId('establishment_id')->constrained()->onDelete('cascade');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->decimal('amount', 10, 2); // Valor total pago pelo cliente
            $table->decimal('commission_amount', 10, 2); // Comissão da plataforma
            $table->decimal('net_amount', 10, 2); // Valor líquido para o estabelecimento
            $table->decimal('commission_percentage', 5, 2); // Porcentagem da comissão
            $table->enum('status', ['pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'])->default('pending');
            $table->enum('type', ['appointment_signal', 'service_payment'])->default('appointment_signal');
            $table->string('description');
            $table->json('payment_method')->nullable(); // Dados do método de pagamento
            $table->json('mercadopago_data')->nullable(); // Dados completos do MercadoPago
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('processed_at')->nullable(); // Quando foi processado para a wallet
            $table->timestamps();
            
            $table->index(['establishment_id', 'status']);
            $table->index(['external_id']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
