import { Head } from '@inertiajs/react';
import { Building2, Calendar, CheckCircle, DollarSign, Package, TrendingUp, UserCheck, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/Admin/AdminLayout';

/**
 * Tipos para os dados do dashboard admin
 */
interface Stats {
    total_establishments: number;
    active_establishments: number;
    inactive_establishments: number;
    total_users: number;
    total_admins: number;
    total_establishment_users: number;
    total_customers: number;
    total_appointments: number;
    pending_appointments: number;
    confirmed_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_services: number;
    active_services: number;
    total_plans: number;
    active_plans: number;
}

interface Establishment {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
    plan: {
        name: string;
        price: number;
    };
}

interface Appointment {
    id: number;
    scheduled_at: string;
    status: string;
    price: number;
    created_at: string;
    establishment: {
        name: string;
    };
    customer: {
        name: string;
    };
    service: {
        name: string;
    };
}

interface AdminDashboardProps {
    auth: any;
    stats: Stats;
    totalRevenue: number;
    mrr: number;
    recentEstablishments: Establishment[];
    recentAppointments: Appointment[];
}

/**
 * Componente de dashboard administrativo
 *
 * Exibe uma visão geral completa do sistema com estatísticas,
 * receita, MRR e atividades recentes.
 */
export default function Dashboard({ auth, stats, totalRevenue, mrr, recentEstablishments, recentAppointments }: AdminDashboardProps) {
    /**
     * Retorna a cor do badge baseada no status
     */
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'suspended':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    /**
     * Formata a data para exibição
     */
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /**
     * Calcula a taxa de conversão
     */
    const conversionRate = stats.total_appointments > 0 ? ((stats.completed_appointments / stats.total_appointments) * 100).toFixed(1) : '0.0';

    return (
        <AdminLayout auth={auth}>
            <Head title="Dashboard Admin - Horaly" />

            <div className="space-y-6">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
                        <p className="text-gray-600">Visão geral do sistema Horaly</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline">Relatórios</Button>
                        <Button>Novo Estabelecimento</Button>
                    </div>
                </div>

                {/* Cards de métricas principais */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* MRR */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">MRR</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">R$ {Number(mrr || 0).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Receita Mensal Recorrente</p>
                        </CardContent>
                    </Card>

                    {/* Receita Total */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">R$ {Number(totalRevenue || 0).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Total de agendamentos pagos</p>
                        </CardContent>
                    </Card>

                    {/* Estabelecimentos Ativos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estabelecimentos Ativos</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_establishments}</div>
                            <p className="text-xs text-muted-foreground">De {stats.total_establishments} totais</p>
                        </CardContent>
                    </Card>

                    {/* Taxa de Conversão */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{conversionRate}%</div>
                            <p className="text-xs text-muted-foreground">Agendamentos concluídos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Cards de estatísticas detalhadas */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total de Usuários */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.total_establishment_users} estabelecimentos, {stats.total_admins} admins
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total de Clientes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_customers}</div>
                            <p className="text-xs text-muted-foreground">Total de clientes cadastrados</p>
                        </CardContent>
                    </Card>

                    {/* Total de Agendamentos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_appointments}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.pending_appointments} pendentes, {stats.confirmed_appointments} confirmados
                            </p>
                        </CardContent>
                    </Card>

                    {/* Serviços Ativos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_services}</div>
                            <p className="text-xs text-muted-foreground">De {stats.total_services} cadastrados</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Estabelecimentos Recentes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estabelecimentos Recentes</CardTitle>
                            <CardDescription>Últimos estabelecimentos cadastrados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentEstablishments.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Nenhum estabelecimento recente</p>
                                ) : (
                                    recentEstablishments.map((establishment) => (
                                        <div key={establishment.id} className="flex items-center space-x-4 rounded-lg border p-3">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">{establishment.name}</p>
                                                    <Badge className={getStatusColor(establishment.status)}>{establishment.status}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {establishment.user.name} - {establishment.plan.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatDate(establishment.created_at)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agendamentos Recentes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Agendamentos Recentes</CardTitle>
                            <CardDescription>Últimos agendamentos do sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentAppointments.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Nenhum agendamento recente</p>
                                ) : (
                                    recentAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center space-x-4 rounded-lg border p-3">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">{appointment.customer.name}</p>
                                                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {appointment.service.name} - {appointment.establishment.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">{formatDate(appointment.scheduled_at)}</p>
                                                    <p className="text-sm font-medium text-green-600">
                                                        R$ {Number(appointment.price || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
