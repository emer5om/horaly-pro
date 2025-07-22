import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import AdminLayout from '@/layouts/Admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Transaction {
    id: number;
    establishment: {
        id: number;
        name: string;
        user: {
            email: string;
        };
    };
    plan: {
        id: number;
        name: string;
    };
    amount: number;
    formatted_amount: string;
    status: string;
    status_label: string;
    status_color: string;
    admin_status: string;
    admin_status_label: string;
    mercadopago_payment_id: string;
    created_at: string;
    paid_at: string | null;
    expires_at: string | null;
    admin_notes: string | null;
}

interface Plan {
    id: number;
    name: string;
}

interface Stats {
    total_pending: number;
    total_approved: number;
    total_rejected: number;
    total_this_month: number;
    count_pending: number;
    count_approved: number;
    count_rejected: number;
}

interface Props {
    transactions: {
        data: Transaction[];
        links: any;
        meta: any;
    };
    filters: {
        status?: string;
        admin_status?: string;
        plan_id?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
    stats: Stats;
    plans: Plan[];
}

export default function TransactionsIndex({ transactions, filters, stats, plans }: Props) {
    const { auth } = usePage<PageProps>();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedAdminStatus, setSelectedAdminStatus] = useState(filters.admin_status || 'all');
    const [selectedPlan, setSelectedPlan] = useState(filters.plan_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(route('admin.transactions.index'), {
            search: searchTerm,
            status: selectedStatus === 'all' ? '' : selectedStatus,
            admin_status: selectedAdminStatus === 'all' ? '' : selectedAdminStatus,
            plan_id: selectedPlan === 'all' ? '' : selectedPlan,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedAdminStatus('all');
        setSelectedPlan('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.transactions.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleExport = () => {
        window.location.href = route('admin.transactions.export', {
            search: searchTerm,
            status: selectedStatus === 'all' ? '' : selectedStatus,
            admin_status: selectedAdminStatus === 'all' ? '' : selectedAdminStatus,
            plan_id: selectedPlan === 'all' ? '' : selectedPlan,
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeVariant = (color: string) => {
        switch (color) {
            case 'green': return 'default';
            case 'yellow': return 'secondary';
            case 'red': return 'destructive';
            case 'gray': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="Transações de Assinaturas" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
                        <p className="text-muted-foreground">
                            Gerencie e monitore os pagamentos de assinaturas PIX
                        </p>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_pending)}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.count_pending} transações
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_approved)}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.count_approved} transações
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_rejected)}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.count_rejected} transações
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_this_month)}</div>
                            <p className="text-xs text-muted-foreground">
                                Total do mês atual
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar estabelecimento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="approved">Aprovado</SelectItem>
                                    <SelectItem value="rejected">Rejeitado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                    <SelectItem value="refunded">Reembolsado</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedAdminStatus} onValueChange={setSelectedAdminStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status Admin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="verified">Verificado</SelectItem>
                                    <SelectItem value="disputed">Disputado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os planos</SelectItem>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id.toString()}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder="Data inicial"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <Input
                                type="date"
                                placeholder="Data final"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleFilter}>
                                Aplicar Filtros
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Limpar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transações</CardTitle>
                        <CardDescription>
                            Lista de todas as transações de assinaturas PIX
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Estabelecimento</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Status Admin</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-mono text-sm">
                                            #{transaction.id}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{transaction.establishment.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {transaction.establishment.user?.email || 'Email não disponível'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {transaction.plan.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {transaction.formatted_amount}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(transaction.status_color)}>
                                                {transaction.status_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {transaction.admin_status_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(transaction.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.visit(route('admin.transactions.show', transaction.id))}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {transactions.data.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhuma transação encontrada
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}