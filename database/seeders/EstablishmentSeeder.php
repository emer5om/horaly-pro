<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EstablishmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Criar usuários para estabelecimentos
        $users = [
            [
                'name' => 'João Silva',
                'email' => 'joao@barbearia.com',
                'password' => bcrypt('password'),
                'role' => 'establishment',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Maria Santos',
                'email' => 'maria@salao.com',
                'password' => bcrypt('password'),
                'role' => 'establishment',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Pedro Costa',
                'email' => 'pedro@academia.com',
                'password' => bcrypt('password'),
                'role' => 'establishment',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            \App\Models\User::create($userData);
        }

        // Criar estabelecimentos
        $establishments = [
            [
                'user_id' => 1,
                'plan_id' => 1,
                'name' => 'Barbearia do João',
                'email' => 'joao@barbearia.com',
                'phone' => '(11) 99999-9999',
                'address' => 'Rua das Flores, 123 - São Paulo, SP',
                'slug' => 'barbearia-joao',
                'description' => 'Barbearia tradicional com mais de 10 anos de experiência.',
                'slogan' => 'Cortando cabelo com estilo desde 2014',
                'colors' => ['primary' => '#1a202c', 'secondary' => '#2d3748'],
                'theme' => 'dark',
                'working_hours' => [
                    'monday' => ['start' => '08:00', 'end' => '18:00'],
                    'tuesday' => ['start' => '08:00', 'end' => '18:00'],
                    'wednesday' => ['start' => '08:00', 'end' => '18:00'],
                    'thursday' => ['start' => '08:00', 'end' => '18:00'],
                    'friday' => ['start' => '08:00', 'end' => '18:00'],
                    'saturday' => ['start' => '08:00', 'end' => '16:00'],
                    'sunday' => null,
                ],
                'plan_expires_at' => now()->addMonth(),
                'status' => 'active',
            ],
            [
                'user_id' => 2,
                'plan_id' => 2,
                'name' => 'Salão da Maria',
                'email' => 'maria@salao.com',
                'phone' => '(11) 88888-8888',
                'address' => 'Av. Paulista, 456 - São Paulo, SP',
                'slug' => 'salao-maria',
                'description' => 'Salão de beleza especializado em cabelo e unhas.',
                'slogan' => 'Beleza e cuidado em primeiro lugar',
                'colors' => ['primary' => '#f687b3', 'secondary' => '#ed64a6'],
                'theme' => 'light',
                'working_hours' => [
                    'monday' => ['start' => '09:00', 'end' => '19:00'],
                    'tuesday' => ['start' => '09:00', 'end' => '19:00'],
                    'wednesday' => ['start' => '09:00', 'end' => '19:00'],
                    'thursday' => ['start' => '09:00', 'end' => '19:00'],
                    'friday' => ['start' => '09:00', 'end' => '19:00'],
                    'saturday' => ['start' => '09:00', 'end' => '17:00'],
                    'sunday' => null,
                ],
                'plan_expires_at' => now()->addMonth(),
                'status' => 'active',
            ],
            [
                'user_id' => 3,
                'plan_id' => 3,
                'name' => 'Academia Force',
                'email' => 'pedro@academia.com',
                'phone' => '(11) 77777-7777',
                'address' => 'Rua da Força, 789 - São Paulo, SP',
                'slug' => 'academia-force',
                'description' => 'Academia completa com personal trainers qualificados.',
                'slogan' => 'Força, disciplina e resultados',
                'colors' => ['primary' => '#2d3748', 'secondary' => '#4a5568'],
                'theme' => 'dark',
                'working_hours' => [
                    'monday' => ['start' => '06:00', 'end' => '22:00'],
                    'tuesday' => ['start' => '06:00', 'end' => '22:00'],
                    'wednesday' => ['start' => '06:00', 'end' => '22:00'],
                    'thursday' => ['start' => '06:00', 'end' => '22:00'],
                    'friday' => ['start' => '06:00', 'end' => '22:00'],
                    'saturday' => ['start' => '08:00', 'end' => '18:00'],
                    'sunday' => ['start' => '08:00', 'end' => '18:00'],
                ],
                'plan_expires_at' => now()->addMonth(),
                'status' => 'active',
            ],
        ];

        foreach ($establishments as $establishment) {
            \App\Models\Establishment::create($establishment);
        }

        // Criar admin
        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@horaly.com',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}
