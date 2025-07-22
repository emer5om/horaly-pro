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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('appointment_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->enum('type', ['appointment_confirmed', 'appointment_pending', 'appointment_cancelled', 'appointment_rescheduled', 'appointment_completed', 'payment_rejected', 'payment_overdue']);
            $table->boolean('read')->default(false);
            $table->string('customer_name')->nullable();
            $table->timestamps();
            
            $table->index(['establishment_id', 'read']);
            $table->index(['establishment_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
