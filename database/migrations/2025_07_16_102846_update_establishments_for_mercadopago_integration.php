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
            if (!Schema::hasColumn('establishments', 'mercadopago_access_token')) {
                $table->text('mercadopago_access_token')->nullable()->after('payment_methods');
            }
            if (!Schema::hasColumn('establishments', 'accepted_payment_methods')) {
                $table->json('accepted_payment_methods')->nullable()->after('mercadopago_access_token');
            }
            if (!Schema::hasColumn('establishments', 'booking_fee_enabled')) {
                $table->boolean('booking_fee_enabled')->default(false)->after('accepted_payment_methods');
            }
            if (!Schema::hasColumn('establishments', 'booking_fee_type')) {
                $table->enum('booking_fee_type', ['fixed', 'percentage'])->default('fixed')->after('booking_fee_enabled');
            }
            if (!Schema::hasColumn('establishments', 'booking_fee_amount')) {
                $table->decimal('booking_fee_amount', 8, 2)->default(0)->after('booking_fee_type');
            }
            if (!Schema::hasColumn('establishments', 'booking_fee_percentage')) {
                $table->decimal('booking_fee_percentage', 5, 2)->default(0)->after('booking_fee_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn([
                'mercadopago_access_token',
                'accepted_payment_methods',
                'booking_fee_enabled',
                'booking_fee_type',
                'booking_fee_amount',
                'booking_fee_percentage'
            ]);
        });
    }
};
