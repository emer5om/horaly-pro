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
        Schema::table('customers', function (Blueprint $table) {
            // Primeiro migrar dados existentes para a tabela pivot
            $this->migrateExistingData();
            
            // Remover apenas a coluna establishment_id (não há foreign key)
            $table->dropColumn('establishment_id');
        });
    }
    
    /**
     * Migrar dados existentes para a tabela pivot
     */
    private function migrateExistingData()
    {
        // Buscar todos os customers que têm establishment_id
        $customers = \DB::table('customers')
            ->whereNotNull('establishment_id')
            ->get();
            
        foreach ($customers as $customer) {
            // Inserir na tabela pivot se não existir
            \DB::table('customer_establishments')->insertOrIgnore([
                'customer_id' => $customer->id,
                'establishment_id' => $customer->establishment_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Reverter: adicionar establishment_id de volta
            $table->foreignId('establishment_id')->nullable()->constrained()->onDelete('cascade');
            
            // Restaurar dados da tabela pivot para establishment_id
            $pivotData = \DB::table('customer_establishments')->get();
            foreach ($pivotData as $pivot) {
                \DB::table('customers')
                    ->where('id', $pivot->customer_id)
                    ->update(['establishment_id' => $pivot->establishment_id]);
            }
        });
    }
};
