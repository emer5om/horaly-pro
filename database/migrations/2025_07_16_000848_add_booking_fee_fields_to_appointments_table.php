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
        Schema::table('appointments', function (Blueprint $table) {
            $table->decimal('booking_fee_amount', 8, 2)->nullable()->after('discount_code');
            $table->enum('booking_fee_status', ['pending', 'paid', 'exempted'])->default('pending')->after('booking_fee_amount');
            $table->foreignId('booking_fee_transaction_id')->nullable()->constrained('transactions')->after('booking_fee_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['booking_fee_transaction_id']);
            $table->dropColumn([
                'booking_fee_amount',
                'booking_fee_status',
                'booking_fee_transaction_id'
            ]);
        });
    }
};
