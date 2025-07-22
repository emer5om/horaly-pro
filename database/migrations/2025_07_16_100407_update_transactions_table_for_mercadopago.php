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
            // Remove Witetec fields if they exist
            if (Schema::hasColumn('transactions', 'pix_txid')) {
                $table->dropColumn('pix_txid');
            }
            if (Schema::hasColumn('transactions', 'pix_qr_code')) {
                $table->dropColumn('pix_qr_code');
            }
            if (Schema::hasColumn('transactions', 'pix_qr_code_text')) {
                $table->dropColumn('pix_qr_code_text');
            }
            if (Schema::hasColumn('transactions', 'witetec_data')) {
                $table->dropColumn('witetec_data');
            }
        });
        
        Schema::table('transactions', function (Blueprint $table) {
            // Add MercadoPago fields
            $table->string('mercadopago_payment_id')->nullable()->after('external_id');
            $table->json('mercadopago_data')->nullable()->after('payment_method');
            $table->string('mercadopago_status')->nullable()->after('mercadopago_data');
            $table->text('pix_qr_code_base64')->nullable()->after('mercadopago_status');
            $table->text('pix_qr_code')->nullable()->after('pix_qr_code_base64');
            $table->timestamp('last_status_check')->nullable()->after('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Remove MercadoPago fields
            $table->dropColumn([
                'mercadopago_payment_id',
                'mercadopago_data',
                'mercadopago_status',
                'pix_qr_code_base64',
                'pix_qr_code',
                'last_status_check'
            ]);
        });
    }
};
