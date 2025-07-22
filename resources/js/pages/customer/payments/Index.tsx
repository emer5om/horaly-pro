import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomerAppLayout from '@/layouts/customer-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, DollarSign, Eye, Filter, Search, Wallet } from 'lucide-react';
import { useState } from 'react';

interface Appointment {
    id: number;
    scheduled_at: string;
    service: {
        name: string;
    };
    establishment: {
        name: string;
    };
}

interface Payment {
    id: number;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    appointment: Appointment;
}

interface PaginationLink {
    url?: string;
    label: string;
    active: boolean;
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Stats {
    total_paid: number;
    total_pending: number;
    total_count: number;
    signals_count: number;
}

interface Filters {
    status?: string;
    date_from?: string;
    date_to?: string;
    [key: string]: string | undefined;
}

interface CustomerPaymentsProps {
    payments: PaginatedPayments;
    filters: Filters;
    stats: Stats;
}

export default function CustomerPayments({
    payments,
    filters,
    stats,
}: CustomerPaymentsProps) {
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
            paid: { label: 'Pago', variant: 'default' as const },
            failed: { label: 'Falhou', variant: 'destructive' as const },
            refunded: { label: 'Reembolsado', variant: 'secondary' as const },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };


    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'credit_card':
                return <CreditCard className="h-4 w-4" />;
            case 'debit_card':
                return <CreditCard className="h-4 w-4" />;
            case 'pix':
                return <Wallet className="h-4 w-4" />;
            case 'cash':
                return <DollarSign className="h-4 w-4" />;
            default:
                return <DollarSign className="h-4 w-4" />;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const methodLabels = {
            credit_card: 'Cartão de Crédito',
            debit_card: 'Cartão de Débito',
            pix: 'PIX',
            cash: 'Dinheiro',
            bank_transfer: 'Transferência',
        };

        return methodLabels[method as keyof typeof methodLabels] || method;
    };

    const applyFilters = () => {
        router.get('/customer/payments', localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        const clearedFilters = {};
        setLocalFilters(clearedFilters);
        router.get('/customer/payments', clearedFilters);
    };

    return (
        <CustomerAppLayout title="Meus Pagamentos">
            <Head title="Meus Pagamentos" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="grid gap-1">
                        <h1 className="text-3xl font-semibold">Meus Pagamentos</h1>
                        <p className="text-muted-foreground">
                            Acompanhe todos os seus pagamentos e sinais
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_paid)}</div>
                            <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_pending)}</div>
                            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_count}</div>
                            <p className="text-xs text-muted-foreground">Número de transações</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sinais Pagos</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.signals_count}</div>
                            <p className="text-xs text-muted-foreground">Sinais realizados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros Avançados</CardTitle>
                            <CardDescription>Refine sua busca por pagamentos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={localFilters.status || ''} 
                                        onValueChange={(value) => setLocalFilters({...localFilters, status: value || undefined})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Todos</SelectItem>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="paid">Pago</SelectItem>
                                            <SelectItem value="failed">Falhou</SelectItem>
                                            <SelectItem value="refunded">Reembolsado</SelectItem>
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

                {/* Lista de Pagamentos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Pagamentos</CardTitle>
                        <CardDescription>
                            {payments.total} pagamento{payments.total !== 1 ? 's' : ''} encontrado{payments.total !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payments.data.length > 0 ? (
                            <div className="space-y-4">
                                {payments.data.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="grid gap-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{payment.appointment.establishment.name}</p>
                                                {getStatusBadge(payment.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{payment.appointment.service.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {getPaymentMethodIcon(payment.payment_method)}
                                                <span>{getPaymentMethodLabel(payment.payment_method)}</span>
                                                <span>•</span>
                                                <span>{formatDateTime(payment.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Agendamento #{payment.appointment.id}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/customer/payments/${payment.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                            </div>
                        )}

                        {/* Paginação */}
                        {payments.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {payments.links.map((link, index) => (
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