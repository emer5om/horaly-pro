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

interface ServiceCreateProps {
    establishment: {
        id: number;
        name: string;
        email: string;
        phone: string;
        status: string;
    };
    planFeatures?: string[];
}

export default function ServiceCreate({ establishment, planFeatures = [] }: ServiceCreateProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ServiceForm>({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        has_promotion: false,
        promotion_price: '',
        allow_rescheduling: true,
        allow_cancellation: true,
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('services.store'), {
            onSuccess: () => {
                reset();
                toast.success('Serviço criado com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao criar serviço');
            },
        });
    };

    return (
        <EstablishmentAppLayout
            title="Novo Serviço"
            breadcrumbs={[
                { title: 'Serviços', href: '/services' },
                { title: 'Novo Serviço', href: '/services/create' },
            ]}
            planFeatures={planFeatures}
        >
            <Head title="Novo Serviço" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/services">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">Novo Serviço</h1>
                        <p className="text-sm text-muted-foreground">Cadastre um novo serviço para seu estabelecimento</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Dados do Serviço
                        </CardTitle>
                        <CardDescription>Preencha os dados básicos do serviço</CardDescription>
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
                                            Salvar Serviço
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

                {/* Tips Card */}
                <Card className="border-slate-200 bg-slate-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                            </svg>
                            Dicas para um bom serviço
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-700">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex items-start gap-2">
                                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500"></div>
                                <p>Use nomes claros e descritivos para seus serviços</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500"></div>
                                <p>Inclua detalhes na descrição para ajudar os clientes</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500"></div>
                                <p>Defina durações realistas considerando tempo de atendimento</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500"></div>
                                <p>Revise seus preços regularmente para manter a competitividade</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </EstablishmentAppLayout>
    );
}
