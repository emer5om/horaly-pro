import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle, Eye, Pause, Play, RotateCcw, Tag, User } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
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
    notes?: string;
    customer: Customer;
    service: Service;
}

interface QueueItem {
    id: number;
    time: string;
    customer_name: string;
    customer_surname: string;
    service_name: string;
    duration: number;
    price: number;
    discount_code?: string;
    discount_amount: number;
    final_price: number;
    status: string;
    notes?: string;
}

interface AgendaPageProps {
    todayAppointments: Appointment[];
    currentAppointment?: Appointment;
    nextClient?: Appointment;
    queue: QueueItem[];
    date: string;
    planFeatures?: string[];
}

export default function AgendaPage({ todayAppointments, currentAppointment, nextClient, queue, date, planFeatures = [] }: AgendaPageProps) {
    const [selectedDate, setSelectedDate] = useState(date);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

    const { props } = usePage();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    const completeForm = useForm({
        notes: '',
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

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isTimerRunning && currentAppointment) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isTimerRunning, currentAppointment]);

    // Initialize timer if there's a current appointment (started)
    useEffect(() => {
        if (currentAppointment && currentAppointment.status === 'started') {
            setIsTimerRunning(true);

            // Calculate elapsed time
            const startTime = new Date(currentAppointment.started_at!).getTime();
            const now = new Date().getTime();
            const elapsed = Math.floor((now - startTime) / 1000);
            setTimer(elapsed);
        } else {
            setIsTimerRunning(false);
            setTimer(0);
        }
    }, [currentAppointment]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartTimer = (appointment: Appointment) => {
        router.post(
            `/appointments/${appointment.id}/start-timer`,
            {},
            {
                onSuccess: () => {
                    setIsTimerRunning(true);
                    setTimer(0);
                    // Reload to update currentAppointment and queue
                    router.reload();
                },
                onError: (errors) => {
                    console.error('Error starting timer:', errors);
                },
            },
        );
    };

    const handlePauseTimer = () => {
        setIsTimerRunning(false);
    };

    const handleResumeTimer = () => {
        setIsTimerRunning(true);
    };

    const handleCompleteService = async () => {
        if (!currentAppointment) return;

        completeForm.post(`/appointments/${currentAppointment.id}/complete`, {
            onSuccess: () => {
                setIsTimerRunning(false);
                setTimer(0);
                setShowCompleteDialog(false);
                // Reload the page to update the queue and next client
                router.reload();
            },
            onError: () => {
                // Error will be shown via flash message
                console.error('Error completing service');
            },
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

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        router.get('/agenda', { date: newDate }, { 
            preserveState: false,
            preserveScroll: false 
        });
    };

    return (
        <EstablishmentAppLayout title="Agenda" planFeatures={planFeatures}>
            <Head title="Agenda" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Agenda</h1>
                        <p className="text-muted-foreground">Gerencie seus atendimentos do dia</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="date">Data:</Label>
                        <Input id="date" type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="w-auto" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Next Client & Timer Card */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Próximo Cliente / Atendimento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Current Service Timer */}
                            {currentAppointment && (
                                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="text-center">
                                        <div className="mb-2 font-mono text-3xl font-bold text-blue-900">{formatTime(timer)}</div>
                                        <p className="mb-3 text-sm text-blue-700">
                                            {currentAppointment.customer.name} - {currentAppointment.service.name}
                                        </p>

                                        <div className="flex gap-2">
                                            {isTimerRunning ? (
                                                <Button onClick={handlePauseTimer} variant="outline" size="sm" className="flex-1">
                                                    <Pause className="mr-2 h-4 w-4" />
                                                    Pausar
                                                </Button>
                                            ) : (
                                                <Button onClick={handleResumeTimer} variant="outline" size="sm" className="flex-1">
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Retomar
                                                </Button>
                                            )}

                                            <Button onClick={() => setShowCompleteDialog(true)} size="sm" className="flex-1">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Concluir
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Next Client */}
                            {nextClient ? (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {nextClient.customer.name} {nextClient.customer.surname}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(nextClient.scheduled_at).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-medium">{nextClient.service.name}</p>
                                        <p className="text-sm text-muted-foreground">{nextClient.service.duration_minutes} min</p>
                                    </div>

                                    <div className="flex items-center justify-between">{getStatusBadge(nextClient.status)}</div>

                                    {nextClient.discount_code && (
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            <span className="text-sm">{nextClient.discount_code}</span>
                                        </div>
                                    )}

                                    {nextClient.status === 'confirmed' && !currentAppointment && (
                                        <Button onClick={() => handleStartTimer(nextClient)} className="w-full" size="lg">
                                            <Play className="mr-2 h-4 w-4" />
                                            Iniciar Atendimento
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                !currentAppointment && (
                                    <div className="py-8 text-center">
                                        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">Nenhum cliente confirmado para hoje</p>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Queue Summary */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Resumo do Dia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span>Total de agendamentos:</span>
                                    <span className="font-semibold">{todayAppointments.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Confirmados:</span>
                                    <span className="font-semibold text-green-600">{todayAppointments.filter((a) => a.status === 'confirmed').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Em atendimento:</span>
                                    <span className="font-semibold text-blue-600">{todayAppointments.filter((a) => a.status === 'started').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Concluídos:</span>
                                    <span className="font-semibold text-green-700">{todayAppointments.filter((a) => a.status === 'completed').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cancelados:</span>
                                    <span className="font-semibold text-red-600">{todayAppointments.filter((a) => a.status === 'cancelled').length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Queue List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fila de Espera</CardTitle>
                        <CardDescription>Lista de clientes agendados para {new Date(selectedDate).toLocaleDateString('pt-BR')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {queue.length > 0 ? (
                            <div className="space-y-4">
                                {queue.map((item, index) => {
                                    // Check if this is the next client (pending/confirmed and earliest time)
                                    const isNextClient = nextClient && item.id === nextClient.id;
                                    
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex flex-col justify-between space-y-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:space-y-0 ${
                                                isNextClient 
                                                    ? 'border-blue-300 bg-blue-50 shadow-sm' 
                                                    : ''
                                            }`}
                                        >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{item.time}</span>
                                                <span className="font-medium">
                                                    {item.customer_name} {item.customer_surname}
                                                </span>
                                                {isNextClient && (
                                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                                        PRÓXIMO
                                                    </span>
                                                )}
                                                {getStatusBadge(item.status)}
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                                {item.service_name} • {item.duration} min
                                            </div>

                                            {item.discount_code && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Tag className="h-3 w-3" />
                                                    <span>{item.discount_code}</span>
                                                    <span className="text-green-600">(-R$ {Number(item.discount_amount).toFixed(2)})</span>
                                                </div>
                                            )}

                                            {item.notes && <p className="text-sm text-muted-foreground">Obs: {item.notes}</p>}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" asChild>
                                                <a href={`/appointments/${item.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Complete Service Dialog */}
            <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Concluir Atendimento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja concluir o atendimento de {currentAppointment?.customer.name}? Tempo decorrido: {formatTime(timer)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Adicione observações sobre o atendimento..."
                            value={completeForm.data.notes}
                            onChange={(e) => completeForm.setData('notes', e.target.value)}
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteService} disabled={completeForm.processing}>
                            {completeForm.processing ? 'Concluindo...' : 'Concluir Atendimento'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EstablishmentAppLayout>
    );
}
