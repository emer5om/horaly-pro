import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Calendar,
    CalendarPlus,
    Crown,
    Edit,
    Eye,
    Filter,
    Mail,
    MoreHorizontal,
    Phone,
    Plus,
    Search,
    Trash2,
    UserCheck,
    Users,
    UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Customer {
    id: number;
    name: string;
    last_name: string;
    email: string;
    phone: string;
    birth_date: string;
    notes: string;
    is_blocked: boolean;
    list_type: string;
    created_at: string;
    full_name: string;
}

interface PageProps {
    customers: {
        data: Customer[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
        links: any[];
    };
    stats: {
        total: number;
        active: number;
        blocked: number;
        vip: number;
    };
    filters: {
        search?: string;
        list_type?: string;
        is_blocked?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    planFeatures?: string[];
    [key: string]: any;
}

export default function CustomersIndex() {
    const { customers, stats, filters, flash, planFeatures = [] } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [listType, setListType] = useState(filters.list_type || 'all');
    const [isBlocked, setIsBlocked] = useState(filters.is_blocked || 'all');

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleSearch = () => {
        router.get(
            '/customers',
            {
                search,
                list_type: listType === 'all' ? '' : listType,
                is_blocked: isBlocked === 'all' ? '' : isBlocked,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setListType('all');
        setIsBlocked('all');
        router.get(
            '/customers',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = (id: number) => {
        router.delete(`/customers/${id}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getListTypeColor = (type: string) => {
        switch (type) {
            case 'vip':
                return 'bg-yellow-100 text-yellow-800';
            case 'priority':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getListTypeLabel = (type: string) => {
        switch (type) {
            case 'vip':
                return 'VIP';
            case 'priority':
                return 'Prioridade';
            default:
                return 'Regular';
        }
    };

    return (
        <EstablishmentAppLayout title="Clientes" planFeatures={planFeatures}>
            <Head title="Clientes" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">VIP</CardTitle>
                            <Crown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.vip}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions and Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar clientes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="max-w-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={listType} onValueChange={setListType}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="regular">Regular</SelectItem>
                                    <SelectItem value="vip">VIP</SelectItem>
                                    <SelectItem value="priority">Prioridade</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={isBlocked} onValueChange={setIsBlocked}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="false">Ativos</SelectItem>
                                    <SelectItem value="true">Bloqueados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSearch} size="sm">
                                Filtrar
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm">
                                Limpar
                            </Button>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/customers/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Clientes</CardTitle>
                        <CardDescription>
                            Mostrando {customers.from} a {customers.to} de {customers.total} clientes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Cadastro</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim()}
                                                </div>
                                                {customer.birth_date && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(customer.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {customer.email && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                                        {customer.email}
                                                    </div>
                                                )}
                                                {customer.phone && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getListTypeColor(customer.list_type)}>{getListTypeLabel(customer.list_type)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={customer.is_blocked ? 'destructive' : 'default'}>
                                                {customer.is_blocked ? 'Bloqueado' : 'Ativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/appointments/create?customer_id=${customer.id}`}>
                                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                                            Agendar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/customers/${customer.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Visualizar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/customers/${customer.id}/edit`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza que deseja excluir o cliente {customer.full_name}? Esta ação não pode
                                                                    ser desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(customer.id)}>
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </EstablishmentAppLayout>
    );
}
