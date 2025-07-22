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
            $table->boolean('booking_fee_enabled')->default(false)->after('payment_methods');
            $table->enum('booking_fee_type', ['fixed', 'percentage'])->default('fixed')->after('booking_fee_enabled');
            $table->decimal('booking_fee_amount', 8, 2)->default(0)->after('booking_fee_type');
            $table->decimal('booking_fee_percentage', 5, 2)->default(0)->after('booking_fee_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn([
                'booking_fee_enabled',
                'booking_fee_type', 
                'booking_fee_amount',
                'booking_fee_percentage'
            ]);
        });
    }
};
