import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, Shield, TestTube } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Establishment {
    id: number;
    name: string;
    charge_fee: boolean;
    fee_type: 'fixed' | 'percentage';
    fee_amount: number | null;
    fee_percentage: number;
    mercadopago_access_token: string | null;
    mercadopago_public_key: string | null;
    mercadopago_sandbox: boolean;
    payment_enabled: boolean;
    payment_methods: string[] | null;
}

interface PaymentsPageProps {
    establishment: Establishment;
}

export default function PaymentsPage({ establishment }: PaymentsPageProps) {
    const [testingConnection, setTestingConnection] = useState(false);

    // Payment settings form
    const paymentForm = useForm({
        charge_fee: establishment.charge_fee,
        fee_type: establishment.fee_type,
        fee_amount: establishment.fee_amount || 5,
        fee_percentage: establishment.fee_percentage,
    });

    // MercadoPago form
    const mercadoPagoForm = useForm({
        mercadopago_access_token: establishment.mercadopago_access_token || '',
        mercadopago_public_key: establishment.mercadopago_public_key || '',
        mercadopago_sandbox: establishment.mercadopago_sandbox,
        payment_enabled: establishment.payment_enabled,
        payment_methods: ['pix'],
    });

    const handlePaymentSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.patch('/establishment/integrations/payment-settings', {
            onSuccess: () => toast.success('Configurações de cobrança atualizadas!'),
            onError: () => toast.error('Erro ao atualizar configurações'),
        });
    };

    const handleMercadoPagoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mercadoPagoForm.patch('/establishment/integrations/mercadopago', {
            onSuccess: () => toast.success('Configurações do Mercado Pago atualizadas!'),
            onError: () => toast.error('Erro ao atualizar configurações'),
        });
    };

    const testMercadoPagoConnection = async () => {
        if (!mercadoPagoForm.data.mercadopago_access_token) {
            toast.error('Token de acesso é obrigatório para testar a conexão');
            return;
        }

        setTestingConnection(true);
        
        try {
            const response = await fetch('/establishment/integrations/mercadopago/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Erro ao testar conexão');
        } finally {
            setTestingConnection(false);
        }
    };

    const togglePaymentMethod = (method: string) => {
        const currentMethods = mercadoPagoForm.data.payment_methods;
        const newMethods = currentMethods.includes(method)
            ? currentMethods.filter(m => m !== method)
            : [...currentMethods, method];
        
        mercadoPagoForm.setData('payment_methods', newMethods);
    };

    return (
        <EstablishmentAppLayout title="Pagamentos">
            <Head title="Pagamentos" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Pagamentos</h1>
                        <p className="text-muted-foreground">Configure recebimento de pagamentos e taxas</p>
                    </div>
                </div>

                <div className="grid gap-6 @4xl/main:grid-cols-2">
                    {/* Payment Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Configurar Recebimento
                            </CardTitle>
                            <CardDescription>
                                Configure se deseja cobrar sinal e qual valor cobrar dos clientes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePaymentSettingsSubmit} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Cobrar Taxa</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Ativar cobrança de sinal dos clientes
                                        </p>
                                    </div>
                                    <Switch
                                        checked={paymentForm.data.charge_fee}
                                        onCheckedChange={(checked) => paymentForm.setData('charge_fee', checked)}
                                    />
                                </div>

                                {paymentForm.data.charge_fee && (
                                    <>
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                            <Label>Tipo de Cobrança</Label>
                                            <Select
                                                value={paymentForm.data.fee_type}
                                                onValueChange={(value: 'fixed' | 'percentage') => paymentForm.setData('fee_type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {paymentForm.data.fee_type === 'fixed' ? (
                                            <div className="space-y-2">
                                                <Label>Valor Fixo (R$)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="5"
                                                    value={paymentForm.data.fee_amount}
                                                    onChange={(e) => paymentForm.setData('fee_amount', parseFloat(e.target.value) || 5)}
                                                    placeholder="5,00"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    Valor mínimo: R$ 5,00
                                                </p>
                                                {paymentForm.errors.fee_amount && (
                                                    <p className="text-sm text-red-600">{paymentForm.errors.fee_amount}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>Porcentagem (10% - 100%)</Label>
                                                <Input
                                                    type="number"
                                                    min="10"
                                                    max="100"
                                                    value={paymentForm.data.fee_percentage}
                                                    onChange={(e) => paymentForm.setData('fee_percentage', parseInt(e.target.value) || 50)}
                                                    placeholder="50"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    {paymentForm.data.fee_percentage}% do valor do serviço
                                                </p>
                                                {paymentForm.errors.fee_percentage && (
                                                    <p className="text-sm text-red-600">{paymentForm.errors.fee_percentage}</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                <Button type="submit" disabled={paymentForm.processing}>
                                    {paymentForm.processing ? 'Salvando...' : 'Salvar Configurações'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* MercadoPago Integration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Credenciais Mercado Pago
                            </CardTitle>
                            <CardDescription>
                                Configure suas credenciais do Mercado Pago para receber pagamentos PIX
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleMercadoPagoSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Access Token</Label>
                                    <Input
                                        type="password"
                                        value={mercadoPagoForm.data.mercadopago_access_token}
                                        onChange={(e) => mercadoPagoForm.setData('mercadopago_access_token', e.target.value)}
                                        placeholder="APP_USR-..."
                                    />
                                    {mercadoPagoForm.errors.mercadopago_access_token && (
                                        <p className="text-sm text-red-600">{mercadoPagoForm.errors.mercadopago_access_token}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Public Key</Label>
                                    <Input
                                        value={mercadoPagoForm.data.mercadopago_public_key}
                                        onChange={(e) => mercadoPagoForm.setData('mercadopago_public_key', e.target.value)}
                                        placeholder="APP_USR-..."
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Modo Sandbox</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Usar ambiente de testes do Mercado Pago
                                        </p>
                                    </div>
                                    <Switch
                                        checked={mercadoPagoForm.data.mercadopago_sandbox}
                                        onCheckedChange={(checked) => mercadoPagoForm.setData('mercadopago_sandbox', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Pagamentos Habilitados</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Permitir pagamentos online
                                        </p>
                                    </div>
                                    <Switch
                                        checked={mercadoPagoForm.data.payment_enabled}
                                        onCheckedChange={(checked) => mercadoPagoForm.setData('payment_enabled', checked)}
                                    />
                                </div>

                                {mercadoPagoForm.data.payment_enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Métodos de Pagamento</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="pix"
                                                        checked={mercadoPagoForm.data.payment_methods.includes('pix')}
                                                        onChange={() => togglePaymentMethod('pix')}
                                                        className="rounded"
                                                    />
                                                    <Label htmlFor="pix">PIX</Label>
                                                </div>
                                            </div>
                                        </div>

                                        <Alert>
                                            <Shield className="h-4 w-4" />
                                            <AlertDescription>
                                                Para receber pagamentos, você precisa ter uma conta no Mercado Pago e suas chaves de API.
                                            </AlertDescription>
                                        </Alert>
                                    </>
                                )}

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={mercadoPagoForm.processing}>
                                        {mercadoPagoForm.processing ? 'Salvando...' : 'Salvar Credenciais'}
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={testMercadoPagoConnection}
                                        disabled={testingConnection || !mercadoPagoForm.data.mercadopago_access_token}
                                    >
                                        <TestTube className="mr-2 h-4 w-4" />
                                        {testingConnection ? 'Testando...' : 'Testar Conexão'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </EstablishmentAppLayout>
    );
}