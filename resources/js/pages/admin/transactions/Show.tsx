import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import AdminLayout from '@/layouts/Admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Eye, ExternalLink } from 'lucide-react';

interface Transaction {
    id: number;
    establishment: {
        id: number;
        name: string;
        user: {
            name: string;
            email: string;
            cpf: string;
            phone: string;
        };
    };
    plan: {
        id: number;
        name: string;
        price: number;
    };
    amount: number;
    formatted_amount: string;
    formatted_paid_amount: string;
    status: string;
    status_label: string;
    status_color: string;
    admin_status: string;
    admin_status_label: string;
    mercadopago_payment_id: string;
    external_reference: string;
    description: string;
    qr_code: string | null;
    qr_code_base64: string | null;
    ticket_url: string | null;
    mercadopago_data: any;
    paid_amount: number | null;
    paid_at: string | null;
    expires_at: string | null;
    admin_notes: string | null;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    transaction: Transaction;
}

export default function TransactionShow({ transaction }: Props) {
    const { auth } = usePage<PageProps>();
    const [adminStatus, setAdminStatus] = useState(transaction.admin_status);
    const [adminNotes, setAdminNotes] = useState(transaction.admin_notes || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        router.put(route('admin.transactions.update', transaction.id), {
            admin_status: adminStatus,
            admin_notes: adminNotes,
        }, {
            onSuccess: () => {
                setIsUpdating(false);
            },
            onError: () => {
                setIsUpdating(false);
            }
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusBadgeVariant = (color: string) => {
        switch (color) {
            case 'green': return 'default';
            case 'yellow': return 'secondary';
            case 'red': return 'destructive';
            case 'gray': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <AdminLayout auth={auth}>
            <Head title={`Transação #${transaction.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(route('admin.transactions.index'))}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Transação #{transaction.id}</h1>
                        <p className="text-muted-foreground">
                            Detalhes da transação de assinatura PIX
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Transaction Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes da Transação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">ID MercadoPago</Label>
                                <div className="font-mono text-sm">{transaction.mercadopago_payment_id}</div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Referência Externa</Label>
                                <div className="font-mono text-sm">{transaction.external_reference}</div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Descrição</Label>
                                <div className="text-sm">{transaction.description}</div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Valor</Label>
                                <div className="text-lg font-bold">{transaction.formatted_amount}</div>
                            </div>

                            {transaction.paid_amount && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Valor Pago</Label>
                                    <div className="text-lg font-bold text-green-600">
                                        {transaction.formatted_paid_amount}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Status</Label>
                                <Badge variant={getStatusBadgeVariant(transaction.status_color)}>
                                    {transaction.status_label}
                                </Badge>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Criado em</Label>
                                <div className="text-sm">{formatDate(transaction.created_at)}</div>
                            </div>

                            {transaction.paid_at && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Pago em</Label>
                                    <div className="text-sm">{formatDate(transaction.paid_at)}</div>
                                </div>
                            )}

                            {transaction.expires_at && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Expira em</Label>
                                    <div className="text-sm">{formatDate(transaction.expires_at)}</div>
                                </div>
                            )}

                            {transaction.ticket_url && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Link do PIX</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(transaction.ticket_url!, '_blank')}
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Abrir Link
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Establishment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estabelecimento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Nome</Label>
                                <div className="text-sm">{transaction.establishment.name}</div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Responsável</Label>
                                <div className="text-sm">{transaction.establishment.user?.name || 'Nome não disponível'}</div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Email</Label>
                                <div className="text-sm">{transaction.establishment.user?.email || 'Email não disponível'}</div>
                            </div>

                            {transaction.establishment.user?.phone && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Telefone</Label>
                                    <div className="text-sm">{transaction.establishment.user.phone}</div>
                                </div>
                            )}

                            {transaction.establishment.user?.cpf && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">CPF</Label>
                                    <div className="text-sm">{transaction.establishment.user.cpf}</div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium">Plano</Label>
                                <Badge variant="outline">
                                    {transaction.plan.name} - {formatCurrency(transaction.plan.price)}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code */}
                    {transaction.qr_code_base64 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>QR Code PIX</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <img 
                                    src={`data:image/png;base64,${transaction.qr_code_base64}`}
                                    alt="QR Code PIX"
                                    className="mx-auto max-w-xs"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Admin Control */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Controle Administrativo</CardTitle>
                            <CardDescription>
                                Atualize o status e adicione notas sobre esta transação
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="admin_status">Status Admin</Label>
                                    <Select value={adminStatus} onValueChange={setAdminStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="verified">Verificado</SelectItem>
                                            <SelectItem value="disputed">Disputado</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="admin_notes">Notas Administrativas</Label>
                                    <Textarea
                                        id="admin_notes"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Adicione observações sobre esta transação..."
                                        rows={4}
                                    />
                                </div>

                                <Button type="submit" disabled={isUpdating}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Subscription Period */}
                    {(transaction.subscription_starts_at || transaction.subscription_ends_at) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Período da Assinatura</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {transaction.subscription_starts_at && (
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Início</Label>
                                        <div className="text-sm">{formatDate(transaction.subscription_starts_at)}</div>
                                    </div>
                                )}

                                {transaction.subscription_ends_at && (
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Fim</Label>
                                        <div className="text-sm">{formatDate(transaction.subscription_ends_at)}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Raw MercadoPago Data */}
                {transaction.mercadopago_data && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Brutos do MercadoPago</CardTitle>
                            <CardDescription>
                                Dados completos retornados pela API do MercadoPago
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                                {JSON.stringify(transaction.mercadopago_data, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}