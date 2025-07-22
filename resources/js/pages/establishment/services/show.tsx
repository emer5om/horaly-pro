import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Clock, DollarSign, Edit, Settings, Tag, Trash2, Users, XCircle } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
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
    usage_count: number;
    created_at: string;
    final_price: number;
}

interface ServiceShowProps {
    service: Service;
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

export default function ServiceShow({ service, planFeatures = [], flash }: ServiceShowProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Mostrar mensagens de toast
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDeleteService = () => {
        router.delete(`/services/${service.id}`, {
            onSuccess: () => {
                toast.success('Serviço excluído com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao excluir serviço');
            },
        });
    };

    const toggleServiceStatus = (currentStatus: boolean) => {
        router.patch(
            `/services/${service.id}/toggle`,
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
        <EstablishmentAppLayout
            title={service.name}
            breadcrumbs={[
                { title: 'Serviços', href: '/services' },
                { title: service.name, href: `/services/${service.id}` },
            ]}
            planFeatures={planFeatures}
        >
            <Head title={service.name} />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/services">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                        <div>
                            <h1 className="flex items-center gap-2 text-lg font-semibold">
                                {service.name}
                                <Badge variant={service.is_active ? 'default' : 'secondary'}>{service.is_active ? 'Ativo' : 'Inativo'}</Badge>
                                {service.has_promotion && <Badge variant="destructive">Promoção</Badge>}
                            </h1>
                            <p className="text-sm text-muted-foreground">Detalhes do serviço oferecido pelo estabelecimento</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant={service.is_active ? 'outline' : 'default'} size="sm" onClick={() => toggleServiceStatus(service.is_active)}>
                            {service.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button asChild>
                            <Link href={`/services/${service.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Service Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Informações do Serviço
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Preço:</span>
                                    <div className="flex items-center gap-2">
                                        {service.has_promotion ? (
                                            <>
                                                <span className="text-sm text-red-500 line-through">R$ {Number(service.price || 0).toFixed(2)}</span>
                                                <span className="font-medium text-green-600">
                                                    R$ {Number(service.promotion_price || 0).toFixed(2)}
                                                </span>
                                                <Badge variant="destructive" className="px-1 py-0 text-xs">
                                                    Promoção
                                                </Badge>
                                            </>
                                        ) : (
                                            <span className="font-medium">R$ {Number(service.price || 0).toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Duração:</span>
                                    <span className="text-sm">{service.duration_minutes} minutos</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Vezes agendado:</span>
                                    <span className="text-sm">{service.usage_count || 0} vezes</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Criado em:</span>
                                    <span className="text-sm">{new Date(service.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>

                            {service.description && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium">Descrição:</span>
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Service Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Configurações de Agendamento
                            </CardTitle>
                            <CardDescription>Configurações que afetam como os clientes podem agendar este serviço</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Permite Reagendamento</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {service.allow_rescheduling ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="text-sm">{service.allow_rescheduling ? 'Sim' : 'Não'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Permite Cancelamento</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {service.allow_cancellation ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="text-sm">{service.allow_cancellation ? 'Sim' : 'Não'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Status do Serviço</span>
                                    </div>
                                    <Badge variant={service.is_active ? 'default' : 'secondary'}>{service.is_active ? 'Ativo' : 'Inativo'}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Serviço
                    </Button>
                    <Button asChild>
                        <Link href={`/services/${service.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Serviço
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o serviço "{service.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteService}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EstablishmentAppLayout>
    );
}
