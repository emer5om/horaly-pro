import { Head, router, usePage } from '@inertiajs/react';
import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, Download, Filter, TrendingUp, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Stats {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_revenue: number;
    new_customers: number;
    cancellation_rate: number;
    avg_revenue: number;
}

interface Service {
    name: string;
    price: number;
    appointments_count: number;
}

interface AppointmentDay {
    date: string;
    count: number;
}

interface BusyHour {
    hour: number;
    count: number;
}

interface Charts {
    appointments_by_day: AppointmentDay[];
    top_services: Service[];
    busy_hours: BusyHour[];
}

interface PageProps {
    stats: Stats;
    charts: Charts;
    period: string;
    date_range: {
        start: string;
        end: string;
    };
    [key: string]: any;
}

export default function ReportsIndex() {
    const { stats, charts, period, date_range } = usePage<PageProps>().props;
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.get(
            '/reports',
            { period: newPeriod },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'day':
                return 'Hoje';
            case 'week':
                return 'Esta semana';
            case 'month':
                return 'Este mês';
            case 'year':
                return 'Este ano';
            default:
                return 'Este mês';
        }
    };

    return (
        <EstablishmentAppLayout title="Relatórios">
            <Head title="Relatórios" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Relatórios</h1>
                        <p className="text-sm text-muted-foreground">Acompanhe o desempenho do seu estabelecimento</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Hoje</SelectItem>
                                <SelectItem value="week">Esta semana</SelectItem>
                                <SelectItem value="month">Este mês</SelectItem>
                                <SelectItem value="year">Este ano</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>

                {/* Period Info */}
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{getPeriodLabel(selectedPeriod)}</Badge>
                    <span className="text-sm text-muted-foreground">
                        {new Date(date_range.start).toLocaleDateString('pt-BR')} - {new Date(date_range.end).toLocaleDateString('pt-BR')}
                    </span>
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
                            <p className="text-xs text-muted-foreground">{stats.completed_appointments} concluídos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
                            <p className="text-xs text-muted-foreground">Média: {formatCurrency(stats.avg_revenue)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.new_customers}</div>
                            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.cancellation_rate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">{stats.cancelled_appointments} cancelados</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Top Services */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Serviços Mais Populares
                            </CardTitle>
                            <CardDescription>Serviços com mais agendamentos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.top_services.length > 0 ? (
                                <div className="space-y-3">
                                    {charts.top_services.map((service, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{service.name}</div>
                                                <div className="text-xs text-muted-foreground">{formatCurrency(service.price)}</div>
                                            </div>
                                            <Badge variant="secondary">{service.appointments_count} agendamentos</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground">
                                    <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                    <p>Nenhum dado disponível</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Busy Hours */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Horários Mais Movimentados
                            </CardTitle>
                            <CardDescription>Horários com mais agendamentos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.busy_hours.length > 0 ? (
                                <div className="space-y-3">
                                    {charts.busy_hours.slice(0, 5).map((hour, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="text-sm font-medium">{formatHour(hour.hour)}</div>
                                            <Badge variant="secondary">{hour.count} agendamentos</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground">
                                    <Clock className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                    <p>Nenhum dado disponível</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Performance Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Resumo de Performance
                            </CardTitle>
                            <CardDescription>Indicadores principais</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Taxa de Conclusão</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-secondary">
                                            <div
                                                className="h-2 rounded-full bg-green-500"
                                                style={{
                                                    width: `${stats.total_appointments > 0 ? (stats.completed_appointments / stats.total_appointments) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium">
                                            {stats.total_appointments > 0
                                                ? ((stats.completed_appointments / stats.total_appointments) * 100).toFixed(1)
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Taxa de Cancelamento</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-secondary">
                                            <div className="h-2 rounded-full bg-red-500" style={{ width: `${stats.cancellation_rate}%` }} />
                                        </div>
                                        <span className="text-sm font-medium">{stats.cancellation_rate.toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="border-t pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Receita Média</span>
                                        <span className="text-sm font-medium">{formatCurrency(stats.avg_revenue)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Agendamentos por Dia</CardTitle>
                        <CardDescription>Distribuição de agendamentos nos últimos 30 dias</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {charts.appointments_by_day.length > 0 ? (
                            <div className="space-y-2">
                                {charts.appointments_by_day.map((day, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <span>{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                                        <Badge variant="outline">{day.count} agendamentos</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-muted-foreground">
                                <Calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                <p>Nenhum agendamento encontrado</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </EstablishmentAppLayout>
    );
}
