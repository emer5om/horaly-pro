import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard } from 'lucide-react';

interface PixPaymentFormProps {
  onSuccess: (transaction: any) => void;
  onError: (error: string) => void;
  items: Array<{
    title: string;
    amount: number;
    quantity: number;
    tangible: boolean;
    external_ref?: string;
  }>;
  totalAmount: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document_type: 'CPF' | 'CNPJ';
  document: string;
}

export default function PixPaymentForm({ onSuccess, onError, items, totalAmount }: PixPaymentFormProps) {
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    document_type: 'CPF',
    document: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  const formatDocument = (value: string, type: 'CPF' | 'CNPJ') => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'CPF') {
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    } else {
      return numbers
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    if (!customer.name.trim()) {
      newErrors.name = ['Nome é obrigatório'];
    }

    if (!customer.email.trim()) {
      newErrors.email = ['E-mail é obrigatório'];
    } else if (!/\S+@\S+\.\S+/.test(customer.email)) {
      newErrors.email = ['E-mail inválido'];
    }

    if (!customer.phone.trim()) {
      newErrors.phone = ['Telefone é obrigatório'];
    }

    if (!customer.document.trim()) {
      newErrors.document = ['Documento é obrigatório'];
    } else {
      const numbers = customer.document.replace(/\D/g, '');
      if (customer.document_type === 'CPF' && numbers.length !== 11) {
        newErrors.document = ['CPF deve ter 11 dígitos'];
      } else if (customer.document_type === 'CNPJ' && numbers.length !== 14) {
        newErrors.document = ['CNPJ deve ter 14 dígitos'];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/pix/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          amount: totalAmount,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone.replace(/\D/g, ''),
          customer_document_type: customer.document_type,
          customer_document: customer.document.replace(/\D/g, ''),
          items: items,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.data);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          onError(data.message || 'Erro ao processar pagamento');
        }
      }
    } catch (error) {
      onError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento PIX
        </CardTitle>
        <CardDescription>
          Preencha os dados para gerar o QR Code PIX
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              value={customer.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite seu nome completo"
              disabled={loading}
            />
            {errors.name && (
              <Alert variant="destructive">
                <AlertDescription>{errors.name[0]}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={customer.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Digite seu e-mail"
              disabled={loading}
            />
            {errors.email && (
              <Alert variant="destructive">
                <AlertDescription>{errors.email[0]}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={customer.phone}
              onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
            {errors.phone && (
              <Alert variant="destructive">
                <AlertDescription>{errors.phone[0]}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Tipo de documento</Label>
            <Select
              value={customer.document_type}
              onValueChange={(value: 'CPF' | 'CNPJ') => handleInputChange('document_type', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">
              {customer.document_type === 'CPF' ? 'CPF' : 'CNPJ'}
            </Label>
            <Input
              id="document"
              type="text"
              value={customer.document}
              onChange={(e) => 
                handleInputChange('document', formatDocument(e.target.value, customer.document_type))
              }
              placeholder={customer.document_type === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
              disabled={loading}
            />
            {errors.document && (
              <Alert variant="destructive">
                <AlertDescription>{errors.document[0]}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalAmount)}
              </span>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Gerar PIX'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}