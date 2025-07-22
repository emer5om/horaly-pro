import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import CustomerAppLayout from '@/layouts/customer-app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Phone, 
    MessageCircle, 
    RotateCcw, 
    X, 
    Edit,
    ArrowLeft
} from 'lucide-react';

interface Establishment {
    id: number;
    name: string;
    phone: string;
    email: string;
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
    status: string;
    price: number;
    discount_amount: number;
    notes?: string;
    cancellation_reason?: string;
    establishment: Establishment;
    service: Service;
}

interface EstablishmentSettings {
    allow_rescheduling: boolean;
    allow_cancellation: boolean;
    reschedule_advance_hours: number;
    cancel_advance_hours: number;
}

interface ServiceSettings {
    allow_rescheduling: boolean;
    allow_cancellation: boolean;
}

interface CustomerAppointmentShowProps {
    appointment: Appointment;
    canReschedule: boolean;
    canCancel: boolean;
    establishmentSettings: EstablishmentSettings;
    serviceSettings: ServiceSettings;
}

export default function CustomerAppointmentShow({
    appointment,
    canReschedule,
    canCancel,
    establishmentSettings,
    serviceSettings,
}: CustomerAppointmentShowProps) {
    const cancelForm = useForm({
        reason: '',
    });

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
            confirmed: { label: 'Confirmado', variant: 'default' as const },
            started: { label: 'Em Atendimento', variant: 'secondary' as const },
            completed: { label: 'Concluído', variant: 'default' as const },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleReschedule = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Abrir WhatsApp para solicitar reagendamento
        const phone = appointment.establishment.phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(
            `Olá! Gostaria de reagendar meu agendamento #${appointment.id} para ${appointment.service.name} que está marcado para ${formatDateTime(appointment.scheduled_at)}. Poderia me ajudar com as opções disponíveis?`
        );
        window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    };

    const handleRepeat = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Repetir agendamento clicado');
        
        // Criar form dinamicamente para garantir POST
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/customer/appointments/${appointment.id}/repeat`;
        
        // Adicionar token CSRF
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        // Adicionar ao body, submeter e remover
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleCancel = () => {
        cancelForm.post(`/customer/appointments/${appointment.id}/cancel`);
    };

    const openWhatsApp = () => {
        const phone = appointment.establishment.phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(
            `Olá! Tenho uma dúvida sobre meu agendamento #${appointment.id} para ${appointment.service.name} em ${formatDateTime(appointment.scheduled_at)}.`
        );
        window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    };

    return (
        <CustomerAppLayout title="Detalhes do Agendamento">
            <Head title={`Agendamento #${appointment.id}`} />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/customer/appointments">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                        <div className="grid gap-1">
                            <h1 className="text-3xl font-semibold">Agendamento #{appointment.id}</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-muted-foreground">{appointment.establishment.name}</p>
                                {getStatusBadge(appointment.status)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Informações Principais */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhes do Serviço</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-sm font-medium">Serviço</Label>
                                        <p className="text-lg">{appointment.service.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Duração</Label>
                                        <p className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {appointment.service.duration_minutes} minutos
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-sm font-medium">Data e Hora</Label>
                                        <p className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {formatDateTime(appointment.scheduled_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Valor</Label>
                                        <div>
                                            <p className="text-lg font-bold">
                                                {formatCurrency(appointment.price - appointment.discount_amount)}
                                            </p>
                                            {appointment.discount_amount > 0 && (
                                                <p className="text-sm text-muted-foreground line-through">
                                                    {formatCurrency(appointment.price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {appointment.notes && (
                                    <div>
                                        <Label className="text-sm font-medium">Observações</Label>
                                        <p className="text-sm">{appointment.notes}</p>
                                    </div>
                                )}

                                {appointment.cancellation_reason && (
                                    <div>
                                        <Label className="text-sm font-medium">Motivo do Cancelamento</Label>
                                        <p className="text-sm text-red-600">{appointment.cancellation_reason}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Estabelecimento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium">Nome</Label>
                                    <p className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {appointment.establishment.name}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Telefone</Label>
                                    <p className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {appointment.establishment.phone}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Email</Label>
                                    <p>{appointment.establishment.email}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ações */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ações</CardTitle>
                                <CardDescription>O que você pode fazer</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Reagendar */}
                                {canReschedule && (
                                    <Button 
                                        type="button"
                                        className="w-full" 
                                        variant="outline"
                                        onClick={handleReschedule}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Reagendar
                                    </Button>
                                )}

                                {/* Repetir Agendamento */}
                                <Button 
                                    type="button"
                                    className="w-full" 
                                    variant="outline"
                                    onClick={handleRepeat}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Repetir Agendamento
                                </Button>

                                {/* WhatsApp */}
                                <Button className="w-full" variant="outline" onClick={openWhatsApp}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Contato WhatsApp
                                </Button>

                                {/* Cancelar */}
                                {canCancel && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="w-full" variant="destructive">
                                                <X className="mr-2 h-4 w-4" />
                                                Cancelar Agendamento
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="space-y-2">
                                                <Label htmlFor="cancel-reason">Motivo do cancelamento (opcional)</Label>
                                                <Textarea
                                                    id="cancel-reason"
                                                    placeholder="Informe o motivo do cancelamento..."
                                                    value={cancelForm.data.reason}
                                                    onChange={(e) => cancelForm.setData('reason', e.target.value)}
                                                />
                                            </div>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Não Cancelar</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleCancel}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Sim, Cancelar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </CardContent>
                        </Card>

                        {/* Informações Importantes */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-blue-900">Informações Importantes</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        {establishmentSettings.allow_rescheduling && serviceSettings.allow_rescheduling ? (
                                            <li>• Reagendamentos só podem ser feitos com {establishmentSettings.reschedule_advance_hours}h de antecedência</li>
                                        ) : !establishmentSettings.allow_rescheduling ? (
                                            <li>• Este estabelecimento não permite reagendamentos</li>
                                        ) : (
                                            <li>• Este serviço não permite reagendamentos</li>
                                        )}
                                        {establishmentSettings.allow_cancellation && serviceSettings.allow_cancellation ? (
                                            <li>• Cancelamentos só podem ser feitos com {establishmentSettings.cancel_advance_hours}h de antecedência</li>
                                        ) : !establishmentSettings.allow_cancellation ? (
                                            <li>• Este estabelecimento não permite cancelamentos</li>
                                        ) : (
                                            <li>• Este serviço não permite cancelamentos</li>
                                        )}
                                        <li>• Entre em contato via WhatsApp para dúvidas</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </CustomerAppLayout>
    );
}