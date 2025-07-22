import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, DollarSign, Save, Tag } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
}

interface ServiceForm {
    name: string;
    description: string;
    price: string;
    duration_minutes: string;
    has_promotion: boolean;
    promotion_price: string;
    allow_rescheduling: boolean;
    allow_cancellation: boolean;
    is_active: boolean;
}

interface ServiceEditProps {
    service: Service;
    establishment: {
        id: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    };
    planFeatures?: string[];
}

export default function ServiceEdit({ service, establishment, planFeatures = [] }: ServiceEditProps) {
    const { data, setData, put, processing, errors } = useForm<ServiceForm>({
        name: service.name,
        description: service.description || '',
        price: service.price.toString(),
        duration_minutes: service.duration_minutes.toString(),
        has_promotion: service.has_promotion || false,
        promotion_price: service.promotion_price?.toString() || '',
        allow_rescheduling: service.allow_rescheduling ?? true,
        allow_cancellation: service.allow_cancellation ?? true,
        is_active: service.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('services.update', service.id), {
            onSuccess: () => {
                toast.success('Serviço atualizado com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar serviço');
            },
        });
    };

    return (
        <EstablishmentAppLayout
            title="Editar Serviço"
            breadcrumbs={[
                { title: 'Serviços', href: '/services' },
                { title: service.name, href: `/services/${service.id}` },
                { title: 'Editar', href: `/services/${service.id}/edit` },
            ]}
            planFeatures={planFeatures}
        >
            <Head title="Editar Serviço" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/services">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">Editar Serviço</h1>
                        <p className="text-sm text-muted-foreground">Atualize os dados do serviço {service.name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Dados do Serviço
                        </CardTitle>
                        <CardDescription>Atualize os dados básicos do serviço</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Serviço *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ex: Corte de Cabelo Masculino"
                                        required
                                    />
                                    {errors.name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_minutes" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Duração (minutos) *
                                    </Label>
                                    <Input
                                        id="duration_minutes"
                                        type="number"
                                        min="1"
                                        value={data.duration_minutes}
                                        onChange={(e) => setData('duration_minutes', e.target.value)}
                                        placeholder="60"
                                        required
                                    />
                                    {errors.duration_minutes && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.duration_minutes}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Preço (R$) *
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0,00"
                                        required
                                    />
                                    {errors.price && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.price}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {data.has_promotion && (
                                    <div className="space-y-2">
                                        <Label htmlFor="promotion_price" className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            Preço Promocional (R$) *
                                        </Label>
                                        <Input
                                            id="promotion_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.promotion_price}
                                            onChange={(e) => setData('promotion_price', e.target.value)}
                                            placeholder="0,00"
                                        />
                                        {errors.promotion_price && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{errors.promotion_price}</AlertDescription>
                                            </Alert>
                                        )}
                                        <p className="text-sm text-muted-foreground">Deve ser menor que o preço normal (R$ {data.price || '0,00'})</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Descreva detalhes do serviço, técnicas utilizadas, etc."
                                    rows={3}
                                />
                                {errors.description && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.description}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                <div className="space-y-1">
                                    <Label htmlFor="has_promotion">Serviço em Promoção</Label>
                                    <p className="text-sm text-muted-foreground">Ative para definir um preço promocional</p>
                                </div>
                                <Switch
                                    id="has_promotion"
                                    checked={data.has_promotion}
                                    onCheckedChange={(checked) => setData('has_promotion', Boolean(checked))}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="allow_rescheduling">Permite Reagendamento</Label>
                                        <p className="text-sm text-muted-foreground">Clientes podem remarcar este serviço</p>
                                    </div>
                                    <Switch
                                        id="allow_rescheduling"
                                        checked={data.allow_rescheduling}
                                        onCheckedChange={(checked) => setData('allow_rescheduling', Boolean(checked))}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="allow_cancellation">Permite Cancelamento</Label>
                                        <p className="text-sm text-muted-foreground">Clientes podem cancelar este serviço</p>
                                    </div>
                                    <Switch
                                        id="allow_cancellation"
                                        checked={data.allow_cancellation}
                                        onCheckedChange={(checked) => setData('allow_cancellation', Boolean(checked))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                <div className="space-y-1">
                                    <Label htmlFor="is_active" className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Serviço Ativo
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Serviços ativos podem ser agendados pelos clientes</p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/services">Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </EstablishmentAppLayout>
    );
}
