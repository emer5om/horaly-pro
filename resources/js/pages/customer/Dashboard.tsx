import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerAppLayout from '@/layouts/customer-app-layout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, Heart, History } from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    full_name: string;
}

interface Establishment {
    id: number;
    name: string;
    phone: string;
}

interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    price: number;
}

interface Appointment {
    id: number;
    scheduled_at: string;
    status: string;
    price: number;
    service: Service;
    establishment: Establishment;
}

interface FavoriteService {
    id: number;
    service: Service & { establishment: Establishment };
}

interface Stats {
    total_appointments: number;
    completed_appointments: number;
    pending_appointments: number;
    favorite_services_count: number;
}

interface CustomerDashboardProps {
    customer: Customer;
    upcomingAppointments: Appointment[];
    lastAppointment?: Appointment;
    stats: Stats;
    favoriteServices: FavoriteService[];
}

export default function CustomerDashboard({
    customer,
    upcomingAppointments,
    lastAppointment,
    stats,
    favoriteServices,
}: CustomerDashboardProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: 'Pendente', variant: 'outline' as const },
            confirmed: { label: 'Confirmado', variant: 'default' as const },
            started: { label: 'Em Atendimento', variant: 'secondary' as const },
            completed: { label: 'Concluído', variant: 'default' as const },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleRepeatAppointment = (appointmentId: number) => {
        // Criar form dinamicamente para garantir POST
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/customer/appointments/${appointmentId}/repeat`;
        
        // Adicionar token CSRF
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        // Submeter form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <CustomerAppLayout title="Minha Área">
            <Head title="Minha Área" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="grid gap-1">
                        <h1 className="text-3xl font-semibold">Olá, {customer.name}!</h1>
                        <p className="text-muted-foreground">
                            Gerencie seus agendamentos e acompanhe seu histórico
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_appointments}</div>
                            <p className="text-xs text-muted-foreground">Todos os tempos</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed_appointments}</div>
                            <p className="text-xs text-muted-foreground">Serviços realizados</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending_appointments}</div>
                            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.favorite_services_count}</div>
                            <p className="text-xs text-muted-foreground">Serviços favoritos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {/* Próximos Agendamentos */}
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Próximos Agendamentos</CardTitle>
                            <CardDescription>Seus agendamentos confirmados e pendentes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="grid gap-1">
                                                <p className="font-medium">{appointment.establishment.name}</p>
                                                <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(appointment.scheduled_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(appointment.price)}</p>
                                                    <p className="text-sm text-muted-foreground">{appointment.service.duration_minutes} min</p>
                                                </div>
                                                {getStatusBadge(appointment.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground">Nenhum agendamento próximo</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Último Agendamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Último Agendamento</CardTitle>
                            <CardDescription>Seu último serviço realizado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {lastAppointment ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-medium">{lastAppointment.establishment.name}</p>
                                        <p className="text-sm text-muted-foreground">{lastAppointment.service.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm">{formatDateTime(lastAppointment.scheduled_at)}</p>
                                        <p className="text-sm font-medium">{formatCurrency(lastAppointment.price)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/customer/appointments/${lastAppointment.id}`}>
                                                Ver Detalhes
                                            </Link>
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => handleRepeatAppointment(lastAppointment.id)}
                                        >
                                            Repetir
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground">
                                    <History className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                    <p className="text-sm">Nenhum agendamento anterior</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Serviços Favoritos */}
                {favoriteServices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5" />
                                Meus Serviços Favoritos
                            </CardTitle>
                            <CardDescription>Seus serviços preferidos para agendamento rápido</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {favoriteServices.map((favorite) => (
                                    <div key={favorite.id} className="rounded-lg border p-4">
                                        <div className="grid gap-1">
                                            <p className="font-medium">{favorite.service.name}</p>
                                            <p className="text-sm text-muted-foreground">{favorite.service.establishment.name}</p>
                                            <p className="text-sm">{formatCurrency(favorite.service.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Ações Rápidas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                        <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href="/customer/appointments">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Ver Agendamentos
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CustomerAppLayout>
    );
}