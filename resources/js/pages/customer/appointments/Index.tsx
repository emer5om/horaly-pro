import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomerAppLayout from '@/layouts/customer-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, Eye, Filter, Search } from 'lucide-react';
import { useState } from 'react';

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
    discount_amount: number;
    establishment: Establishment;
    service: Service;
}

interface PaginationLink {
    url?: string;
    label: string;
    active: boolean;
}

interface PaginatedAppointments {
    data: Appointment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Stats {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
}

interface Filters {
    filter: string;
    status?: string;
    establishment?: string;
    date_from?: string;
    date_to?: string;
    [key: string]: string | undefined;
}

interface CustomerAppointmentsProps {
    appointments: PaginatedAppointments;
    establishments: Establishment[];
    filters: Filters;
    stats: Stats;
}

export default function CustomerAppointments({
    appointments,
    establishments,
    filters,
    stats,
}: CustomerAppointmentsProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

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

    const applyFilters = () => {
        router.get('/customer/appointments', localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        const clearedFilters = { filter: 'upcoming' };
        setLocalFilters(clearedFilters);
        router.get('/customer/appointments', clearedFilters);
    };

    const switchFilter = (newFilter: string) => {
        const updatedFilters = { ...localFilters, filter: newFilter };
        setLocalFilters(updatedFilters);
        router.get('/customer/appointments', updatedFilters);
    };


    return (
        <CustomerAppLayout title="Meus Agendamentos">
            <Head title="Meus Agendamentos" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="grid gap-1">
                        <h1 className="text-3xl font-semibold">Meus Agendamentos</h1>
                        <p className="text-muted-foreground">
                            Acompanhe todos os seus agendamentos e histórico
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card 
                        className={`cursor-pointer transition-colors ${filters.filter === 'all' ? 'bg-primary/10' : ''}`}
                        onClick={() => switchFilter('all')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">Todos os agendamentos</p>
                        </CardContent>
                    </Card>
                    
                    <Card 
                        className={`cursor-pointer transition-colors ${filters.filter === 'upcoming' ? 'bg-primary/10' : ''}`}
                        onClick={() => switchFilter('upcoming')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.upcoming}</div>
                            <p className="text-xs text-muted-foreground">Confirmados e pendentes</p>
                        </CardContent>
                    </Card>
                    
                    <Card 
                        className={`cursor-pointer transition-colors ${filters.filter === 'history' && filters.status === 'completed' ? 'bg-primary/10' : ''}`}
                        onClick={() => {
                            setLocalFilters({ filter: 'history', status: 'completed' });
                            router.get('/customer/appointments', { filter: 'history', status: 'completed' });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed}</div>
                            <p className="text-xs text-muted-foreground">Serviços realizados</p>
                        </CardContent>
                    </Card>
                    
                    <Card 
                        className={`cursor-pointer transition-colors ${filters.filter === 'history' && filters.status === 'cancelled' ? 'bg-primary/10' : ''}`}
                        onClick={() => {
                            setLocalFilters({ filter: 'history', status: 'cancelled' });
                            router.get('/customer/appointments', { filter: 'history', status: 'cancelled' });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.cancelled}</div>
                            <p className="text-xs text-muted-foreground">Agendamentos cancelados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros Avançados</CardTitle>
                            <CardDescription>Refine sua busca por agendamentos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={localFilters.status || 'all'} 
                                        onValueChange={(value) => setLocalFilters({...localFilters, status: value === 'all' ? undefined : value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="confirmed">Confirmado</SelectItem>
                                            <SelectItem value="started">Em Atendimento</SelectItem>
                                            <SelectItem value="completed">Concluído</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Estabelecimento</Label>
                                    <Select 
                                        value={localFilters.establishment || 'all'} 
                                        onValueChange={(value) => setLocalFilters({...localFilters, establishment: value === 'all' ? undefined : value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {establishments.map((est) => (
                                                <SelectItem key={est.id} value={est.id.toString()}>
                                                    {est.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Data De</Label>
                                    <Input
                                        type="date"
                                        value={localFilters.date_from || ''}
                                        onChange={(e) => setLocalFilters({...localFilters, date_from: e.target.value || undefined})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Data Até</Label>
                                    <Input
                                        type="date"
                                        value={localFilters.date_to || ''}
                                        onChange={(e) => setLocalFilters({...localFilters, date_to: e.target.value || undefined})}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button onClick={applyFilters}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Aplicar Filtros
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Limpar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Lista de Agendamentos */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {filters.filter === 'upcoming' && 'Próximos Agendamentos'}
                            {filters.filter === 'history' && 'Histórico de Agendamentos'}
                            {filters.filter === 'all' && 'Todos os Agendamentos'}
                        </CardTitle>
                        <CardDescription>
                            {appointments.total} agendamento{appointments.total !== 1 ? 's' : ''} encontrado{appointments.total !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {appointments.data.length > 0 ? (
                            <div className="space-y-4">
                                {appointments.data.map((appointment) => (
                                    <div key={appointment.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="grid gap-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{appointment.establishment.name}</p>
                                                {getStatusBadge(appointment.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(appointment.scheduled_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    {formatCurrency(appointment.price - appointment.discount_amount)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {appointment.service.duration_minutes} min
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/customer/appointments/${appointment.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                            </div>
                        )}

                        {/* Paginação */}
                        {appointments.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {appointments.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CustomerAppLayout>
    );
}