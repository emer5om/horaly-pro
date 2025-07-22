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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('duration_minutes');
            $table->boolean('has_promotion')->default(false);
            $table->decimal('promotion_price', 10, 2)->nullable();
            $table->boolean('allow_rescheduling')->default(true);
            $table->boolean('allow_cancellation')->default(true);
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0); // Para controlar serviços mais usados
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
