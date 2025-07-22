<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'Carlos',
                'last_name' => 'Silva',
                'email' => 'carlos@gmail.com',
                'phone' => '(11) 99999-1111',
                'birth_date' => '1990-05-15',
                'notes' => 'Cliente fiel, sempre pontual',
                'list_type' => 'vip',
            ],
            [
                'name' => 'Ana',
                'last_name' => 'Costa',
                'email' => 'ana@gmail.com',
                'phone' => '(11) 99999-2222',
                'birth_date' => '1985-12-03',
                'notes' => 'Prefere horários da manhã',
                'list_type' => 'regular',
            ],
            [
                'name' => 'Roberto',
                'last_name' => 'Santos',
                'email' => 'roberto@gmail.com',
                'phone' => '(11) 99999-3333',
                'birth_date' => '1992-08-20',
                'notes' => 'Já cancelou 3 agendamentos',
                'list_type' => 'priority',
            ],
            [
                'name' => 'Fernanda',
                'last_name' => 'Oliveira',
                'email' => 'fernanda@gmail.com',
                'phone' => '(11) 99999-4444',
                'birth_date' => '1988-03-10',
                'notes' => 'Gosta de experimentar novos serviços',
                'list_type' => 'regular',
            ],
            [
                'name' => 'Lucas',
                'last_name' => 'Pereira',
                'email' => 'lucas@gmail.com',
                'phone' => '(11) 99999-5555',
                'birth_date' => '1995-11-28',
                'notes' => 'Personal trainer, cliente VIP',
                'list_type' => 'vip',
            ],
            [
                'name' => 'Mariana',
                'last_name' => 'Ferreira',
                'email' => 'mariana@gmail.com',
                'phone' => '(11) 99999-6666',
                'birth_date' => '1987-07-14',
                'notes' => 'Sempre agenda para sábados',
                'list_type' => 'regular',
            ],
            [
                'name' => 'Paulo',
                'last_name' => 'Rodrigues',
                'email' => 'paulo@gmail.com',
                'phone' => '(11) 99999-7777',
                'birth_date' => '1980-01-25',
                'notes' => 'Cliente desde 2020',
                'list_type' => 'vip',
            ],
            [
                'name' => 'Juliana',
                'last_name' => 'Alves',
                'email' => 'juliana@gmail.com',
                'phone' => '(11) 99999-8888',
                'birth_date' => '1993-09-12',
                'notes' => 'Sempre traz amigas',
                'list_type' => 'regular',
            ],
        ];

        foreach ($customers as $customer) {
            \App\Models\Customer::create($customer);
        }
    }
}
