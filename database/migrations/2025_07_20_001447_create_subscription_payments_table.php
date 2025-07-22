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
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            
            // MercadoPago data
            $table->string('mercadopago_payment_id')->unique();
            $table->string('external_reference');
            $table->decimal('amount', 10, 2);
            $table->string('description');
            
            // Payment status
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'refunded'])->default('pending');
            $table->string('mercadopago_status')->nullable();
            $table->string('status_detail')->nullable();
            
            // PIX data
            $table->text('qr_code')->nullable();
            $table->text('qr_code_base64')->nullable();
            $table->string('ticket_url')->nullable();
            
            // Payment details
            $table->json('mercadopago_data')->nullable(); // Full MercadoPago response
            $table->decimal('paid_amount', 10, 2)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // Admin control
            $table->text('admin_notes')->nullable();
            $table->enum('admin_status', ['pending', 'verified', 'disputed', 'cancelled'])->default('pending');
            
            // Subscription period
            $table->timestamp('subscription_starts_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['establishment_id', 'status']);
            $table->index(['plan_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('mercadopago_payment_id');
            $table->index('external_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};