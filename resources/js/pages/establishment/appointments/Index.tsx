import { Head, Link, router } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, Edit, Eye, Filter, Plus, Trash2, TrendingUp, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Customer {
    id: number;
    name: string;
    surname?: string;
    phone: string;
    email?: string;
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
    started_at?: string;
    completed_at?: string;
    status: 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled';
    price: number;
    discount_amount: number;
    discount_code?: string;
    final_price: number;
    notes?: string;
    cancellation_reason?: string;
    customer: Customer;
    service: Service;
}

interface Statistics {
    confirmed: number;
    completed: number;
    pending: number;
    cancelled: number;
    total: number;
}

interface AppointmentIndexProps {
    appointments: Appointment[];
    filter: 'day' | 'week' | 'month';
    date: string;
    statistics: Statistics;
    planFeatures?: string[];
}

export default function AppointmentIndex({ appointments, filter, date, statistics, planFeatures = [] }: AppointmentIndexProps) {
    const [selectedFilter, setSelectedFilter] = useState(filter);
    const [selectedDate, setSelectedDate] = useState(date);
    const [deleteAppointment, setDeleteAppointment] = useState<Appointment | null>(null);

    const handleFilterChange = (newFilter: string, newDate?: string) => {
        const dateParam = newDate || selectedDate;
        setSelectedFilter(newFilter as 'day' | 'week' | 'month');
        setSelectedDate(dateParam);

        router.get('/appointments', {
            filter: newFilter,
            date: dateParam,
        });
    };

    const handleDateChange = (newDate: string) => {
        handleFilterChange(selectedFilter, newDate);
    };

    const handleDelete = () => {
        if (!deleteAppointment) return;

        router.delete(`/appointments/${deleteAppointment.id}`, {
            onSuccess: () => {
                setDeleteAppointment(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
            confirmed: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
            started: { label: 'Em Atendimento', variant: 'secondary' as const, icon: Users },
            completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const IconComponent = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const getFilterLabel = () => {
        switch (selectedFilter) {
            case 'week':
                return 'Semana';
            case 'month':
                return 'Mês';
            default:
                return 'Dia';
        }
    };

    return (
        <EstablishmentAppLayout title="Agendamentos" planFeatures={planFeatures}>
            <Head title="Agendamentos" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Agendamentos</h1>
                        <p className="text-muted-foreground">Gerencie todos os agendamentos do seu estabelecimento</p>
                    </div>

                    <Button asChild>
                        <Link href="/appointments/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Agendamento
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="space-y-2">
                                <Label>Período</Label>
                                <Select value={selectedFilter} onValueChange={(value) => handleFilterChange(value)}>
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Dia</SelectItem>
                                        <SelectItem value="week">Semana</SelectItem>
                                        <SelectItem value="month">Mês</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total}</div>
                            <p className="text-xs text-muted-foreground">{getFilterLabel()} atual</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.pending}</div>
                            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.confirmed}</div>
                            <p className="text-xs text-muted-foreground">Agendamentos confirmados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.completed}</div>
                            <p className="text-xs text-muted-foreground">Serviços realizados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.cancelled}</div>
                            <p className="text-xs text-muted-foreground">Agendamentos cancelados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Appointments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Agendamentos</CardTitle>
                        <CardDescription>
                            {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} encontrado{appointments.length !== 1 ? 's' : ''}{' '}
                            para {getFilterLabel().toLowerCase()} selecionado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {appointments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data/Hora</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Serviço</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appointments.map((appointment) => {
                                            const dateTime = formatDateTime(appointment.scheduled_at);
                                            return (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{dateTime.date}</div>
                                                            <div className="text-sm text-muted-foreground">{dateTime.time}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {appointment.customer.name} {appointment.customer.surname}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">{appointment.customer.phone}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{appointment.service.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {appointment.service.duration_minutes} min
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            {appointment.discount_code ? (
                                                                <>
                                                                    <div className="font-medium">
                                                                        R${' '}
                                                                        {(
                                                                            appointment.final_price ||
                                                                            Number(appointment.price) - Number(appointment.discount_amount || 0)
                                                                        ).toFixed(2)}
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground line-through">
                                                                        R$ {Number(appointment.price).toFixed(2)}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="font-medium">R$ {Number(appointment.price).toFixed(2)}</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/appointments/${appointment.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>

                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/appointments/${appointment.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>

                                                            <Button variant="outline" size="sm" onClick={() => setDeleteAppointment(appointment)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">Nenhum agendamento encontrado</h3>
                                <p className="mb-4 text-muted-foreground">Não há agendamentos para o período selecionado.</p>
                                <Button asChild>
                                    <Link href="/appointments/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Criar Primeiro Agendamento
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteAppointment !== null} onOpenChange={() => setDeleteAppointment(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o agendamento de {deleteAppointment?.customer.name}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EstablishmentAppLayout>
    );
}
