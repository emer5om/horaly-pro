import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateRangePicker from '@/components/ui/date-range-picker';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Activity, Calendar, CalendarDays, DollarSign, Eye, Star, TrendingUp, Users, CheckCircle, Clock, X, BarChart3, TrendingDown, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

/**
 * Tipos para os dados do dashboard
 */
interface Establishment {
    id: number;
    name: string;
    slug: string;
    email: string;
    phone: string;
    status: string;
    plan?: {
        name: string;
        price: number;
    };
}

interface Stats {
    total_appointments: number;
    total_appointments_change: number;
    pending_appointments: number;
    pending_appointments_change: number;
    confirmed_appointments: number;
    confirmed_appointments_change: number;
    completed_appointments: number;
    completed_appointments_change: number;
    cancelled_appointments: number;
    cancelled_appointments_change: number;
    total_customers: number;
    monthly_revenue: number;
    monthly_revenue_change: number;
    average_ticket: number;
    average_ticket_change: number;
    free_slots_percentage: number;
    free_slots_change: number;
}

interface Appointment {
    id: number;
    scheduled_at: string;
    status: string;
    customer: {
        name: string;
        phone: string;
    };
    service: {
        name: string;
        price: number;
        duration_minutes: number;
    };
    price: number;
    discount_amount: number;
}


interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    full_name: string;
}

interface RevenueChartData {
    period: string;
    revenue: number;
}

interface ReportsData {
    recent_customers: Customer[];
    revenue_chart: RevenueChartData[];
}

interface DashboardProps {
    establishment: Establishment;
    stats: Stats;
    todayAppointments: Appointment[];
    reportsData: ReportsData;
    chartPeriod?: string;
    planFeatures?: string[];
    filterPeriod?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Componente de dashboard do estabelecimento
 */
export default function EstablishmentDashboard({
    establishment,
    stats = {
        total_appointments: 0,
        total_appointments_change: 0,
        pending_appointments: 0,
        pending_appointments_change: 0,
        confirmed_appointments: 0,
        confirmed_appointments_change: 0,
        completed_appointments: 0,
        completed_appointments_change: 0,
        cancelled_appointments: 0,
        cancelled_appointments_change: 0,
        total_customers: 0,
        monthly_revenue: 0,
        monthly_revenue_change: 0,
        average_ticket: 0,
        average_ticket_change: 0,
        free_slots_percentage: 85.5,
        free_slots_change: 1.2,
    },
    todayAppointments = [],
    reportsData = {
        recent_customers: [],
        revenue_chart: [],
    },
    chartPeriod = 'month',
    planFeatures = [],
    filterPeriod = 'month',
    startDate = '',
    endDate = '',
}: DashboardProps) {
    const [selectedChartPeriod, setSelectedChartPeriod] = useState(chartPeriod);
    const [selectedFilterPeriod, setSelectedFilterPeriod] = useState(filterPeriod);
    const [dateRange, setDateRange] = useState({
        from: startDate ? new Date(startDate) : null,
        to: endDate ? new Date(endDate) : null,
    });

    // Helper para formatar valores em Real brasileiro
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Helper para formatar mudanças percentuais
    const formatChange = (change: number) => {
        const isPositive = change >= 0;
        const icon = isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        const sign = isPositive ? '+' : '';
        
        return (
            <span className={`flex items-center gap-1 text-xs ${color}`}>
                {icon}
                {sign}{change}%
            </span>
        );
    };

    // Função para alterar período do gráfico
    const handleChartPeriodChange = (period: string) => {
        setSelectedChartPeriod(period);
        router.get('/dashboard', { chart_period: period }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['reportsData']
        });
    };

    // Função para aplicar filtros
    const handleFilterChange = (period: string) => {
        const params: Record<string, string> = { filter_period: period };
        setSelectedFilterPeriod(period);
        
        // Se for custom e temos range selecionado, incluir as datas
        if (period === 'custom' && dateRange.from && dateRange.to) {
            params.start_date = dateRange.from.toISOString().split('T')[0];
            params.end_date = dateRange.to.toISOString().split('T')[0];
        }
        
        router.get('/dashboard', params, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    // Função para lidar com mudança no date range picker
    const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
        setDateRange(range);
        
        // Auto-aplicar quando ambas as datas forem selecionadas
        if (range.from && range.to) {
            const params = {
                filter_period: 'custom',
                start_date: range.from.toISOString().split('T')[0],
                end_date: range.to.toISOString().split('T')[0],
            };
            
            router.get('/dashboard', params, {
                preserveState: false,
                preserveScroll: true,
            });
        }
    };

    // Verificação de segurança
    if (!establishment) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Carregando...</h2>
                    <p className="text-gray-600">Preparando seu dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <EstablishmentAppLayout title="Dashboard" planFeatures={planFeatures}>
            <Head title={`Dashboard - ${establishment.name}`} />

            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {/* Header Section */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="grid gap-1">
                            <h1 className="text-3xl font-semibold">Dashboard</h1>
                            <p className="text-sm text-muted-foreground">
                                {selectedFilterPeriod === 'day' && 'Métricas de hoje'}
                                {selectedFilterPeriod === 'week' && 'Métricas desta semana'}
                                {selectedFilterPeriod === 'month' && 'Métricas deste mês'}
                                {selectedFilterPeriod === 'year' && 'Métricas deste ano'}
                                {selectedFilterPeriod === 'custom' && dateRange.from && dateRange.to && 
                                    `Período de ${dateRange.from.toLocaleDateString('pt-BR')} a ${dateRange.to.toLocaleDateString('pt-BR')}`}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {/* Filtros integrados */}
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedFilterPeriod} onValueChange={handleFilterChange}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Hoje</SelectItem>
                                        <SelectItem value="week">Esta Semana</SelectItem>
                                        <SelectItem value="month">Este Mês</SelectItem>
                                        <SelectItem value="year">Este Ano</SelectItem>
                                        <SelectItem value="custom">Customizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range Picker para período customizado */}
                            {selectedFilterPeriod === 'custom' && (
                                <DateRangePicker
                                    value={dateRange}
                                    onValueChange={handleDateRangeChange}
                                    placeholder="Selecionar período"
                                    className="w-[260px]"
                                />
                            )}

                            <Button asChild>
                                <Link href="/appointments/create">
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Novo Agendamento
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.monthly_revenue || 0)}</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.monthly_revenue_change)}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_appointments}</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.total_appointments_change)}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.average_ticket || 0)}</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.average_ticket_change)}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agenda Livre</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Number(stats.free_slots_percentage || 0).toFixed(1)}%</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.free_slots_change)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Second Row of Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.confirmed_appointments}</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.confirmed_appointments_change)}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.completed_appointments}</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.completed_appointments_change)}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                                <X className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.cancelled_appointments}</div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">vs mês anterior</p>
                                    {formatChange(stats.cancelled_appointments_change)}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_customers}</div>
                                <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Gráfico de Faturamento
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedChartPeriod === 'day' && 'Evolução da receita nos últimos 30 dias'}
                                        {selectedChartPeriod === 'week' && 'Evolução da receita nas últimas 12 semanas'}
                                        {selectedChartPeriod === 'month' && 'Evolução da receita nos últimos 6 meses'}
                                        {selectedChartPeriod === 'year' && 'Evolução da receita nos últimos 5 anos'}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { key: 'day', label: 'Dia' },
                                        { key: 'week', label: 'Semana' },
                                        { key: 'month', label: 'Mês' },
                                        { key: 'year', label: 'Ano' }
                                    ].map((option) => (
                                        <Button
                                            key={option.key}
                                            variant={selectedChartPeriod === option.key ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleChartPeriodChange(option.key)}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {reportsData.revenue_chart && reportsData.revenue_chart.length > 0 ? (
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={reportsData.revenue_chart} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" />
                                            <XAxis 
                                                dataKey="period" 
                                                className="text-xs fill-muted-foreground"
                                                tick={{ fontSize: 12 }}
                                                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                                            />
                                            <YAxis 
                                                className="text-xs fill-muted-foreground"
                                                tick={{ fontSize: 12 }}
                                                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                                                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                                                tickFormatter={(value) => {
                                                    // Formatação mais compacta para mobile
                                                    if (value >= 1000) {
                                                        return `R$ ${(value / 1000).toFixed(0)}k`;
                                                    }
                                                    return `R$ ${value}`;
                                                }}
                                                width={60} // Garantir espaço suficiente para os valores
                                            />
                                            <Tooltip 
                                                formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                contentStyle={{ 
                                                    backgroundColor: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="hsl(var(--primary))" 
                                                strokeWidth={3}
                                                fill="url(#colorRevenue)"
                                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                                                activeDot={{ 
                                                    r: 6, 
                                                    stroke: 'hsl(var(--primary))', 
                                                    strokeWidth: 2,
                                                    fill: 'hsl(var(--background))'
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                        <p className="text-sm">Dados insuficientes para exibir o gráfico</p>
                                        <p className="text-xs text-muted-foreground mt-1">Complete alguns agendamentos para ver o gráfico</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Main Content Grid */}
                    <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {/* Establishment Info */}
                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Informações do Estabelecimento</CardTitle>
                                <CardDescription>Dados principais do seu negócio</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <div className="text-sm text-muted-foreground">Email</div>
                                        <div className="font-medium">{establishment.email}</div>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="text-sm text-muted-foreground">Telefone</div>
                                        <div className="font-medium">{establishment.phone}</div>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="text-sm text-muted-foreground">Status</div>
                                        <Badge variant={establishment.status === 'active' ? 'default' : 'secondary'}>
                                            {establishment.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="text-sm text-muted-foreground">Plano</div>
                                        <div className="font-medium">{establishment.plan?.name || 'Não definido'}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ações Rápidas</CardTitle>
                                <CardDescription>Acesse as principais funcionalidades</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <Button variant="outline" className="justify-start" asChild>
                                    <Link href="/appointments">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Ver Agendamentos
                                    </Link>
                                </Button>
                                <Button variant="outline" className="justify-start" asChild>
                                    <Link href="/customers">
                                        <Users className="mr-2 h-4 w-4" />
                                        Gerenciar Clientes
                                    </Link>
                                </Button>
                                <Button variant="outline" className="justify-start" asChild>
                                    <Link href="/services">
                                        <Star className="mr-2 h-4 w-4" />
                                        Configurar Serviços
                                    </Link>
                                </Button>
                                <Button variant="outline" className="justify-start" asChild>
                                    <Link href="/settings">
                                        <Star className="mr-2 h-4 w-4" />
                                        Configurações
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reports Section */}
                    <div className="grid gap-4 md:gap-6 lg:grid-cols-2">

                        {/* Recent Customers */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Clientes Recentes
                                </CardTitle>
                                <CardDescription>Últimos clientes cadastrados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportsData.recent_customers.length > 0 ? (
                                    <div className="space-y-3">
                                        {reportsData.recent_customers.map((customer) => (
                                            <div key={customer.id} className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{customer.full_name || customer.name}</div>
                                                    <div className="text-xs text-muted-foreground">{customer.email || customer.phone}</div>
                                                </div>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/customers/${customer.id}`}>
                                                        <Eye className="h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-muted-foreground">
                                        <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                        <p className="text-sm">Nenhum cliente cadastrado</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Performance Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Resumo de Performance
                                </CardTitle>
                                <CardDescription>Indicadores principais do mês</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Taxa de Conclusão</span>
                                        <span className="text-sm font-medium">
                                            {stats.total_appointments > 0
                                                ? ((stats.completed_appointments / stats.total_appointments) * 100).toFixed(1) + '%'
                                                : '0%'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Pendentes</span>
                                        <span className="text-sm font-medium text-yellow-600">{stats.pending_appointments}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Taxa de Cancelamento</span>
                                        <span className="text-sm font-medium text-red-600">
                                            {stats.total_appointments > 0
                                                ? ((stats.cancelled_appointments / stats.total_appointments) * 100).toFixed(1) + '%'
                                                : '0%'}
                                        </span>
                                    </div>
                                    <div className="border-t pt-4">
                                        <div className="text-xs text-muted-foreground mb-2">Disponibilidade da Agenda</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-2">
                                                <div 
                                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${100 - (stats.free_slots_percentage || 0)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium">
                                                {(100 - (stats.free_slots_percentage || 0)).toFixed(1)}% ocupada
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Appointments */}
                    {todayAppointments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Agendamentos de Hoje</CardTitle>
                                <CardDescription>{todayAppointments.length} agendamento(s) para hoje</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {todayAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="grid gap-1">
                                                <p className="leading-none font-medium">{appointment.customer.name}</p>
                                                <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency((appointment.price - appointment.discount_amount) || 0)}</p>
                                                    <p className="text-sm text-muted-foreground">{appointment.service.duration_minutes} min</p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        appointment.status === 'confirmed'
                                                            ? 'default'
                                                            : appointment.status === 'pending'
                                                              ? 'secondary'
                                                              : 'outline'
                                                    }
                                                >
                                                    {appointment.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State for Today's Appointments */}
                    {todayAppointments.length === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Agendamentos de Hoje</CardTitle>
                                <CardDescription>Nenhum agendamento para hoje</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                        <Calendar className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">Nenhum agendamento hoje</h3>
                                    <p className="mt-2 mb-4 text-sm text-muted-foreground">
                                        Você não tem agendamentos para hoje. Que tal promover seus serviços?
                                    </p>
                                    <Button asChild>
                                        <Link href="/appointments/create">
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            Criar Agendamento
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </EstablishmentAppLayout>
    );
}
