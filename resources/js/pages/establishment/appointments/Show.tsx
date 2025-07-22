import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit,
    FileText,
    Scissors,
    Tag,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
    description?: string;
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

interface ShowAppointmentProps {
    appointment: Appointment;
    planFeatures?: string[];
}

export default function ShowAppointment({ appointment, planFeatures = [] }: ShowAppointmentProps) {
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    
    const { props } = usePage();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    const statusForm = useForm({
        status: appointment.status,
        cancellation_reason: appointment.cancellation_reason || '',
    });

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleStatusUpdate = () => {
        statusForm.patch(`/appointments/${appointment.id}/status`, {
            onSuccess: () => {
                setShowStatusDialog(false);
            },
            onError: (errors) => {
                console.error('Status update error:', errors);
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
            confirmed: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            started: { label: 'Em Atendimento', variant: 'secondary' as const, icon: User, color: 'text-blue-600' },
            completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
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
        return date.toLocaleString('pt-BR');
    };

    const formatDuration = (startedAt?: string, completedAt?: string) => {
        if (!startedAt || !completedAt) return null;

        const start = new Date(startedAt);
        const end = new Date(completedAt);
        const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);

        return `${duration} minutos`;
    };

    return (
        <EstablishmentAppLayout title="Detalhes do Agendamento" planFeatures={planFeatures}>
            <Head title="Detalhes do Agendamento" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/appointments">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Agendamento #{appointment.id}</h1>
                        <p className="text-muted-foreground">Visualize e gerencie os detalhes do agendamento</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
                            Alterar Status
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/appointments/${appointment.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informações do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                                <p className="font-semibold">
                                    {appointment.customer.name} {appointment.customer.surname}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                                <p>{appointment.customer.phone}</p>
                            </div>

                            {appointment.customer.email && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                    <p>{appointment.customer.email}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Service Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Scissors className="h-5 w-5" />
                                Informações do Serviço
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Serviço</Label>
                                <p className="font-semibold">{appointment.service.name}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Duração Prevista</Label>
                                <p>{appointment.service.duration_minutes} minutos</p>
                            </div>

                            {appointment.service.description && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                                    <p>{appointment.service.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Appointment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Detalhes do Agendamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                <div className="mt-1">{getStatusBadge(appointment.status)}</div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Data/Hora Agendada</Label>
                                <p className="font-semibold">{formatDateTime(appointment.scheduled_at)}</p>
                            </div>

                            {appointment.started_at && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Iniciado em</Label>
                                    <p>{formatDateTime(appointment.started_at)}</p>
                                </div>
                            )}

                            {appointment.completed_at && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Concluído em</Label>
                                    <p>{formatDateTime(appointment.completed_at)}</p>
                                </div>
                            )}

                            {formatDuration(appointment.started_at, appointment.completed_at) && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Duração Real</Label>
                                    <p>{formatDuration(appointment.started_at, appointment.completed_at)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Informações Financeiras
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Preço Original</Label>
                                <p className={appointment.discount_amount > 0 ? 'text-muted-foreground line-through' : 'font-semibold'}>
                                    R$ {Number(appointment.price).toFixed(2)}
                                </p>
                            </div>

                            {appointment.discount_code && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Código de Desconto</Label>
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            <p>{appointment.discount_code}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Desconto</Label>
                                        <p className="text-green-600">-R$ {Number(appointment.discount_amount).toFixed(2)}</p>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Valor Final</Label>
                                <p className="text-xl font-bold">
                                    R${' '}
                                    {(appointment.final_price
                                        ? Number(appointment.final_price)
                                        : Number(appointment.price) - Number(appointment.discount_amount || 0)
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notes and Additional Information */}
                {(appointment.notes || appointment.cancellation_reason) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Observações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appointment.notes && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Observações Gerais</Label>
                                    <p className="mt-1 rounded-md bg-muted p-3">{appointment.notes}</p>
                                </div>
                            )}

                            {appointment.cancellation_reason && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Motivo do Cancelamento</Label>
                                    <p className="mt-1 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                                        {appointment.cancellation_reason}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Status Change Dialog */}
            <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Alterar Status do Agendamento</AlertDialogTitle>
                        <AlertDialogDescription>Selecione o novo status para este agendamento.</AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Novo Status</Label>
                            <Select value={statusForm.data.status} onValueChange={(value) => statusForm.setData('status', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                    <SelectItem value="started">Em Atendimento</SelectItem>
                                    <SelectItem value="completed">Concluído</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {statusForm.data.status === 'cancelled' && (
                            <div className="space-y-2">
                                <Label>Motivo do Cancelamento</Label>
                                <Textarea
                                    placeholder="Informe o motivo do cancelamento..."
                                    value={statusForm.data.cancellation_reason}
                                    onChange={(e) => statusForm.setData('cancellation_reason', e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStatusUpdate} disabled={statusForm.processing}>
                            Confirmar Alteração
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                            <br />
                            <br />
                            <strong>Cliente:</strong> {appointment.customer.name} {appointment.customer.surname}
                            <br />
                            <strong>Serviço:</strong> {appointment.service.name}
                            <br />
                            <strong>Data:</strong> {formatDateTime(appointment.scheduled_at)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                window.location.href = `/appointments/${appointment.id}`;
                                // This would be handled by a form submission in a real implementation
                                fetch(`/appointments/${appointment.id}`, { method: 'DELETE' });
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir Agendamento
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EstablishmentAppLayout>
    );
}
