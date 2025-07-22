import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building, Edit, Eye, Filter, Lock, MoreHorizontal, Plus, Search, Shield, Trash, Unlock, UserCog } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/Admin/AdminLayout';

interface Plan {
    id: number;
    name: string;
    price: number;
    billing_cycle: string;
    is_active: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Establishment {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    slug: string;
    status: 'active' | 'inactive' | 'blocked';
    created_at: string;
    plan: Plan;
    user: User;
}

interface PageProps {
    establishments: {
        data: Establishment[];
        links: any[];
        current_page: number;
        from: number;
        to: number;
        total: number;
        last_page: number;
        per_page: number;
    };
    plans: Plan[];
    filters: {
        search?: string;
        status?: string;
        plan_id?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function EstablishmentsIndex() {
    const { establishments, plans, filters, flash, auth } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [planFilter, setPlanFilter] = useState(filters.plan_id || 'all');

    const handleSearch = () => {
        router.get('/admin/establishments', {
            search: searchTerm,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            plan_id: planFilter !== 'all' ? planFilter : undefined,
        });
    };

    const handleStatusChange = (establishmentId: number, currentStatus: string) => {
        const action = currentStatus === 'blocked' ? 'desbloquear' : 'bloquear';
        
        if (confirm(`Tem certeza que deseja ${action} este estabelecimento?`)) {
            router.patch(`/admin/establishments/${establishmentId}/toggle-block`, {}, {
                onSuccess: () => {
                    toast.success(flash?.success || `Estabelecimento ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
                },
                onError: () => {
                    toast.error('Erro ao alterar status do estabelecimento');
                },
            });
        }
    };

    const handleDelete = (establishmentId: number, establishmentName: string) => {
        if (confirm(`Tem certeza que deseja excluir o estabelecimento "${establishmentName}"? Esta ação não pode ser desfeita.`)) {
            router.delete(`/admin/establishments/${establishmentId}`, {
                onSuccess: () => {
                    toast.success('Estabelecimento excluído com sucesso!');
                },
                onError: () => {
                    toast.error('Erro ao excluir estabelecimento');
                },
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inativo</Badge>;
            case 'blocked':
                return <Badge variant="destructive">Bloqueado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatPrice = (price: number, cycle: string) => {
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
        
        return `${formatted}/${cycle === 'monthly' ? 'mês' : 'ano'}`;
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="Gerenciar Estabelecimentos" />

            <div className="@container/main flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold sm:text-2xl">Estabelecimentos</h1>
                        <p className="text-sm text-muted-foreground sm:text-base">Gerencie todos os estabelecimentos da plataforma</p>
                    </div>
                    <Button asChild className="w-fit">
                        <Link href="/admin/establishments/create">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Novo Estabelecimento</span>
                            <span className="sm:hidden">Novo</span>
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                        <CardDescription>Use os filtros abaixo para encontrar estabelecimentos específicos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Buscar</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="search"
                                        placeholder="Nome, email, telefone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} size="sm">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                        <SelectItem value="blocked">Bloqueado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="plan">Plano</Label>
                                <Select value={planFilter} onValueChange={setPlanFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Planos</SelectItem>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id.toString()}>
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button onClick={handleSearch} className="w-full">
                                    Aplicar Filtros
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Lista de Estabelecimentos
                            <Badge variant="outline" className="ml-auto">
                                {establishments.total} estabelecimentos
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Estabelecimento</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Criado em</TableHead>
                                        <TableHead className="w-[70px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {establishments.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                                <p className="text-muted-foreground">Nenhum estabelecimento encontrado</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        establishments.data.map((establishment) => (
                                            <TableRow key={establishment.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{establishment.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            /{establishment.slug}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {establishment.city}, {establishment.state}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="text-sm">{establishment.email}</div>
                                                        <div className="text-sm text-muted-foreground">{establishment.phone}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{establishment.plan.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatPrice(establishment.plan.price, establishment.plan.billing_cycle)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(establishment.status)}</TableCell>
                                                <TableCell>
                                                    {new Date(establishment.created_at).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/establishments/${establishment.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Visualizar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/establishments/${establishment.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Editar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusChange(establishment.id, establishment.status)}
                                                                className={establishment.status === 'blocked' ? 'text-green-600' : 'text-orange-600'}
                                                            >
                                                                {establishment.status === 'blocked' ? (
                                                                    <>
                                                                        <Unlock className="mr-2 h-4 w-4" />
                                                                        Desbloquear
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Lock className="mr-2 h-4 w-4" />
                                                                        Bloquear
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(establishment.id, establishment.name)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {establishments.links && establishments.links.length > 3 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {establishments.from} a {establishments.to} de {establishments.total} estabelecimentos
                                </div>
                                <div className="flex space-x-2">
                                    {establishments.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
