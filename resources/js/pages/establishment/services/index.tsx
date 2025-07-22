import { Head, Link, router } from '@inertiajs/react';
import { Clock, DollarSign, Edit, Plus, Search, Settings, Tag, Trash2 } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    has_promotion: boolean;
    promotion_price: number;
    allow_rescheduling: boolean;
    allow_cancellation: boolean;
    is_active: boolean;
    created_at: string;
    final_price: number;
}

interface ServicesIndexProps {
    services: Service[];
    establishment: {
        id: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    };
    planFeatures?: string[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ServicesIndex({ services, establishment, planFeatures = [], flash }: ServicesIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteServiceId, setDeleteServiceId] = useState<number | null>(null);

    // Mostrar mensagens de toast
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const filteredServices = services.filter(
        (service) =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) || service.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleDeleteService = (id: number) => {
        router.delete(`/services/${id}`, {
            onSuccess: () => {
                setDeleteServiceId(null);
                toast.success('Serviço excluído com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao excluir serviço');
            },
        });
    };

    const toggleServiceStatus = (id: number, currentStatus: boolean) => {
        router.patch(
            `/services/${id}/toggle`,
            {
                is_active: !currentStatus,
            },
            {
                onSuccess: () => {
                    toast.success(!currentStatus ? 'Serviço ativado!' : 'Serviço desativado!');
                },
                onError: () => {
                    toast.error('Erro ao alterar status do serviço');
                },
            },
        );
    };

    return (
        <EstablishmentAppLayout title="Serviços" planFeatures={planFeatures}>
            <Head title="Serviços" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Serviços</h1>
                        <p className="text-sm text-muted-foreground">Gerencie os serviços oferecidos pelo seu estabelecimento</p>
                    </div>
                    <Button asChild>
                        <Link href="/services/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Serviço
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{services.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
                            <Badge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{services.filter((s) => s.is_active).length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Em Promoção</CardTitle>
                            <Tag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{services.filter((s) => s.has_promotion).length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length) : 0} min
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Lista de Serviços</CardTitle>
                                <CardDescription>Visualize e gerencie todos os seus serviços</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar serviços..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredServices.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Preço</TableHead>
                                        <TableHead>Duração</TableHead>
                                        <TableHead>Configurações</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        {service.has_promotion ? (
                                                            <>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-sm text-red-500 line-through">
                                                                        R$ {Number(service.price || 0).toFixed(2)}
                                                                    </span>
                                                                    <Badge variant="destructive" className="px-1 py-0 text-xs">
                                                                        Promoção
                                                                    </Badge>
                                                                </div>
                                                                <span className="font-medium text-green-600">
                                                                    R$ {Number(service.promotion_price || 0).toFixed(2)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="font-medium">R$ {Number(service.price || 0).toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Clock className="mr-1 h-4 w-4" />
                                                    {service.duration_minutes} min
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {service.allow_rescheduling && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Reagenda
                                                        </Badge>
                                                    )}
                                                    {service.allow_cancellation && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Cancela
                                                        </Badge>
                                                    )}
                                                    {!service.allow_rescheduling && !service.allow_cancellation && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Restrito
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={service.is_active ? 'default' : 'secondary'}
                                                    className="cursor-pointer"
                                                    onClick={() => toggleServiceStatus(service.id, service.is_active)}
                                                >
                                                    {service.is_active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/services/${service.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/services/${service.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="outline" size="sm" onClick={() => setDeleteServiceId(service.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">
                                    {searchTerm ? 'Nenhum serviço encontrado com esse termo.' : 'Nenhum serviço cadastrado ainda.'}
                                </p>
                                {!searchTerm && (
                                    <Link href="/services/create">
                                        <Button className="mt-4">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Criar Primeiro Serviço
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteServiceId !== null} onOpenChange={() => setDeleteServiceId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteServiceId && handleDeleteService(deleteServiceId)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EstablishmentAppLayout>
    );
}
