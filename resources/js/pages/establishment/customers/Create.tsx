import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Crown, FileText, Mail, Phone, Save, User } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Props {
    planFeatures?: string[];
    [key: string]: any;
}

export default function CustomersCreate({ planFeatures = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        notes: '',
        list_type: 'regular',
        is_blocked: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/customers');
    };

    return (
        <EstablishmentAppLayout
            title="Novo Cliente"
            breadcrumbs={[
                { title: 'Clientes', href: '/customers' },
                { title: 'Novo Cliente', href: '/customers/create' },
            ]}
            planFeatures={planFeatures}
        >
            <Head title="Novo Cliente" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">Novo Cliente</h1>
                        <p className="text-sm text-muted-foreground">Cadastre um novo cliente no sistema</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Dados do Cliente
                        </CardTitle>
                        <CardDescription>Preencha os dados básicos do cliente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nome do cliente"
                                        required
                                    />
                                    {errors.name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Sobrenome</Label>
                                    <Input
                                        id="last_name"
                                        type="text"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Sobrenome do cliente"
                                    />
                                    {errors.last_name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.last_name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@exemplo.com"
                                    />
                                    {errors.email && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.email}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Telefone
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                    {errors.phone && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.phone}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Data de Nascimento
                                    </Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={data.birth_date}
                                        onChange={(e) => setData('birth_date', e.target.value)}
                                    />
                                    {errors.birth_date && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.birth_date}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="list_type" className="flex items-center gap-2">
                                        <Crown className="h-4 w-4" />
                                        Tipo de Cliente
                                    </Label>
                                    <Select value={data.list_type} onValueChange={(value) => setData('list_type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="vip">VIP</SelectItem>
                                            <SelectItem value="priority">Prioridade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.list_type && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.list_type}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Observações
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Observações sobre o cliente (opcional)"
                                    rows={3}
                                />
                                {errors.notes && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.notes}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                <div className="space-y-1">
                                    <Label htmlFor="is_blocked">Cliente Bloqueado</Label>
                                    <p className="text-sm text-muted-foreground">Clientes bloqueados não podem fazer agendamentos</p>
                                </div>
                                <Switch
                                    id="is_blocked"
                                    checked={data.is_blocked}
                                    onCheckedChange={(checked) => setData('is_blocked', Boolean(checked))}
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
                                            Salvar Cliente
                                        </>
                                    )}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/customers">Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </EstablishmentAppLayout>
    );
}
