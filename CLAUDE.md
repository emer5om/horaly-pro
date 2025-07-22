# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
- `npm run dev` - Start Vite dev server for frontend development
- `npm run build` - Build frontend assets for production
- `npm run build:ssr` - Build both client and SSR assets
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run types` - Run TypeScript type checking

### Backend Development
- `php artisan serve` - Start Laravel development server
- `php artisan test` - Run PHP tests with Pest
- `composer dev` - Start full development environment (server, queue, logs, vite)
- `composer dev:ssr` - Start development with SSR
- `composer test` - Run tests with config clearing

### Database
- `php artisan migrate` - Run database migrations
- `php artisan migrate:fresh --seed` - Fresh migration with seeding

## Architecture Overview

This is a Laravel + React application using the Inertia.js stack:

### Backend (Laravel)
- **Framework**: Laravel 12 with PHP 8.2+
- **Routes**: Defined in `routes/web.php`, `routes/auth.php`, `routes/settings.php`
- **Controllers**: Located in `app/Http/Controllers/` with Auth and Settings subdirectories
- **Models**: User model in `app/Models/`
- **Testing**: Uses Pest PHP testing framework

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with Laravel integration
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI primitives with custom components in `resources/js/components/ui/`
- **Routing**: Handled by Inertia.js server-side routing
- **State Management**: React hooks, no external state management library

### Key Frontend Structure
- **Pages**: `resources/js/pages/` - Inertia.js page components
- **Components**: `resources/js/components/` - Reusable React components
- **Layouts**: `resources/js/layouts/` - Page layout components
- **Hooks**: `resources/js/hooks/` - Custom React hooks
- **Types**: `resources/js/types/` - TypeScript type definitions
- **Utils**: `resources/js/lib/utils.ts` - Utility functions

### Component Architecture
- Uses a component-based architecture with shadcn/ui-style components
- App shell pattern with sidebar navigation (`app-shell.tsx`)
- Layout components for different page types (auth, admin, settings)
- Custom UI components built on Radix UI primitives

### Path Aliases
- `@/*` maps to `resources/js/*` for frontend imports
- `ziggy-js` maps to Laravel Ziggy route helper

### Code Quality Tools
- **ESLint**: Configured for React, TypeScript, and React Hooks
- **Prettier**: With Tailwind CSS and import organization plugins
- **TypeScript**: Strict mode enabled with ESNext target
- **Laravel Pint**: For PHP code formatting (Laravel's opinionated PHP CS Fixer)

### Testing
- **Frontend**: No specific test framework configured yet
- **Backend**: Pest PHP with Laravel plugin for feature and unit tests

## Database Structure (HORALY - Sistema de Agendamento)

### Core Tables
- **users**: Sistema de usuários (admin, establishment, customer)
- **plans**: Planos de assinatura do SaaS
- **establishments**: Estabelecimentos (salões, barbearias, academias, etc.)
- **services**: Serviços oferecidos por cada estabelecimento
- **customers**: Clientes dos estabelecimentos
- **appointments**: Agendamentos entre clientes e estabelecimentos

### Test Data (Seeders)
Após executar `php artisan migrate:fresh --seed`, o banco terá:

**Admin:**
- Email: admin@horaly.com
- Senha: admin123

**Estabelecimentos:**
1. Barbearia do João (joao@barbearia.com / password)
2. Salão da Maria (maria@salao.com / password)
3. Academia Force (pedro@academia.com / password)

**Dados de Teste:**
- 3 Planos (Starter, Professional, Enterprise)
- 3 Estabelecimentos ativos
- 14 Serviços variados
- 8 Clientes
- 10 Agendamentos (diversos status)

## Sistema de Autenticação

### Rotas Implementadas
- `/login` - Login de estabelecimentos
- `/register` - Registro de estabelecimentos
- `/admin/login` - Login de administradores
- `/dashboard` - Dashboard do estabelecimento
- `/admin/dashboard` - Dashboard do administrador

### Funcionalidades Implementadas
- **Login de Estabelecimentos**: Autenticação com email/senha e "lembrar-me"
- **Registro de Estabelecimentos**: Cadastro completo com dados pessoais, do estabelecimento e seleção de plano
- **Login de Admin**: Interface diferenciada para administradores
- **Middleware de Roles**: Proteção por papel (admin, establishment, customer)
- **Dashboards**: Interfaces completas com estatísticas e dados em tempo real

### Componentes Frontend
- Páginas de login e registro responsivas com shadcn/ui
- Dashboard do estabelecimento com métricas e agendamentos
- Dashboard do admin com visão geral do sistema
- Todos os componentes bem comentados e organizados

### Credenciais para Teste
- **Estabelecimentos**: Use as credenciais dos seeders (joao@barbearia.com / password)
- **Admin**: admin@horaly.com / admin123

### Próximos Passos
O sistema está pronto para desenvolvimento das funcionalidades específicas:
1. Gestão de agendamentos
2. Gestão de serviços
3. Gestão de clientes
4. Configurações do estabelecimento
5. Painel administrativo completo