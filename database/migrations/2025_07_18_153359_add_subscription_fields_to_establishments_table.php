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
        Schema::table('establishments', function (Blueprint $table) {
            $table->enum('subscription_status', ['trial', 'active', 'suspended', 'cancelled', 'overdue'])->default('trial');
            $table->string('efipay_subscription_id')->nullable();
            $table->string('efipay_plan_id')->nullable();
            $table->timestamp('subscription_started_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamp('subscription_updated_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->integer('subscription_value')->nullable(); // valor em centavos
            $table->string('subscription_plan_name')->nullable();
            $table->json('subscription_metadata')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_status',
                'efipay_subscription_id',
                'efipay_plan_id',
                'subscription_started_at',
                'subscription_expires_at',
                'subscription_updated_at',
                'trial_ends_at',
                'subscription_value',
                'subscription_plan_name',
                'subscription_metadata'
            ]);
        });
    }
};
