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
        Schema::create('establishments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->text('address');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->text('description')->nullable();
            $table->string('slogan')->nullable();
            $table->json('colors')->nullable(); // Cores do link
            $table->string('theme')->default('default');
            $table->json('working_hours')->nullable(); // Horários de funcionamento
            $table->json('blocked_dates')->nullable(); // Datas bloqueadas
            $table->json('blocked_times')->nullable(); // Horários bloqueados
            $table->boolean('allow_rescheduling')->default(true);
            $table->boolean('allow_cancellation')->default(true);
            $table->integer('reschedule_advance_hours')->default(24);
            $table->integer('cancel_advance_hours')->default(24);
            $table->integer('slots_per_hour')->default(1);
            $table->boolean('payment_enabled')->default(false);
            $table->json('payment_methods')->nullable(); // ['pix', 'credit_card', 'debit_card']
            $table->string('whatsapp_instance_id')->nullable();
            $table->string('facebook_pixel_id')->nullable();
            $table->string('google_analytics_id')->nullable();
            $table->string('google_tag_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_blocked')->default(false);
            $table->timestamp('plan_expires_at')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('establishments');
    }
};
