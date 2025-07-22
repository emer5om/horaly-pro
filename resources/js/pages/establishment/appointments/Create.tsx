import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Plus, Save, Scissors, Search, User, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Customer {
    id: number;
    name: string;
    last_name?: string;
    phone: string;
    email?: string;
    full_name?: string;
}

interface Service {
    id: number;
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
}

interface CreateAppointmentProps {
    services: Service[];
    customers: Customer[];
    selectedCustomer?: Customer;
    planFeatures?: string[];
}

export default function CreateAppointment({ services, customers, selectedCustomer, planFeatures = [] }: CreateAppointmentProps) {
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedSearchCustomer, setSelectedSearchCustomer] = useState<Customer | null>(selectedCustomer || null);
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: selectedCustomer ? selectedCustomer.id.toString() : '',
        service_id: '',
        scheduled_at: '',
        notes: '',
        discount_code: '',
    });

    // Real-time search function
    const searchCustomers = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (response.ok) {
                const results = await response.json();
                setSearchResults(Array.isArray(results) ? results : []);
                setShowSearchResults(true);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setShowSearchResults(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search input changes with debouncing
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchCustomers(customerSearch);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [customerSearch]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedSearchCustomer(customer);
        setData('customer_id', customer.id.toString());
        setCustomerSearch('');
        setShowSearchResults(false);
    };

    const handleClearSelection = () => {
        setSelectedSearchCustomer(null);
        setData('customer_id', '');
        setCustomerSearch('');
    };

    const newCustomerForm = useForm({
        name: '',
        last_name: '',
        phone: '',
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/appointments');
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(newCustomerForm.data),
            });

            const result = await response.json();

            if (result.success && result.customer) {
                const customerData = {
                    id: result.customer.id,
                    name: result.customer.name,
                    last_name: result.customer.last_name,
                    full_name: `${result.customer.name} ${result.customer.last_name || ''}`.trim(),
                    phone: result.customer.phone,
                    email: result.customer.email,
                };
                setSelectedSearchCustomer(customerData);
                setData('customer_id', result.customer.id.toString());
                setShowNewCustomer(false);
                newCustomerForm.reset();
            } else {
                console.error('Error creating customer:', result);
            }
        } catch (error) {
            console.error('Error creating customer:', error);
        }
    };


    const selectedService = services.find((service) => service.id.toString() === data.service_id);

    return (
        <EstablishmentAppLayout title="Novo Agendamento" planFeatures={planFeatures}>
            <Head title="Novo Agendamento" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/appointments">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{selectedCustomer ? `Agendar para ${selectedCustomer.name}` : 'Novo Agendamento'}</h1>
                        <p className="text-muted-foreground">
                            {selectedCustomer
                                ? `Cliente: ${selectedCustomer.full_name || `${selectedCustomer.name} ${selectedCustomer.last_name || ''}`} - ${selectedCustomer.phone}`
                                : 'Crie um novo agendamento para seu cliente'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Client Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informações do Cliente
                                </CardTitle>
                                <CardDescription>Selecione o cliente para este agendamento</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedSearchCustomer && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-green-800">
                                                    <strong>Cliente selecionado:</strong>{' '}
                                                    {selectedSearchCustomer.full_name || `${selectedSearchCustomer.name} ${selectedSearchCustomer.last_name || ''}`}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {selectedSearchCustomer.phone} {selectedSearchCustomer.email && `• ${selectedSearchCustomer.email}`}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearSelection}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {!showNewCustomer ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="customer_search">Pesquisar Cliente *</Label>
                                            <div className="relative" ref={searchInputRef}>
                                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="customer_search"
                                                    placeholder="Digite nome, telefone ou email..."
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    onFocus={() => customerSearch.length >= 2 && setShowSearchResults(true)}
                                                    className="pl-8"
                                                    disabled={!!selectedSearchCustomer}
                                                />
                                                
                                                {/* Search Results Dropdown */}
                                                {showSearchResults && !selectedSearchCustomer && customerSearch.length >= 2 && (
                                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
                                                        {isLoading ? (
                                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                                Pesquisando...
                                                            </div>
                                                        ) : searchResults.length > 0 ? (
                                                            <div className="p-1">
                                                                {searchResults.map((customer) => (
                                                                    <button
                                                                        key={customer.id}
                                                                        type="button"
                                                                        onClick={() => handleSelectCustomer(customer)}
                                                                        className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                    >
                                                                        <div className="font-medium">
                                                                            {customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim()}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {customer.phone} {customer.email && `• ${customer.email}`}
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                                Nenhum cliente encontrado para "{customerSearch}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {errors.customer_id && <p className="text-sm text-red-500">{errors.customer_id}</p>}
                                        </div>

                                        {!selectedSearchCustomer && (
                                            <div className="flex justify-between pt-2">
                                                <Button type="button" variant="outline" onClick={() => setShowNewCustomer(true)} size="sm">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Novo Cliente
                                                </Button>

                                                <Button variant="outline" asChild size="sm">
                                                    <Link href="/customers/create">Cadastrar na Lista</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <form onSubmit={handleCreateCustomer} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-semibold">Criar Novo Cliente</Label>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCustomer(false)}>
                                                Cancelar
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="new_name">Nome *</Label>
                                                <Input
                                                    id="new_name"
                                                    value={newCustomerForm.data.name}
                                                    onChange={(e) => newCustomerForm.setData('name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="new_last_name">Sobrenome</Label>
                                                <Input
                                                    id="new_last_name"
                                                    value={newCustomerForm.data.last_name}
                                                    onChange={(e) => newCustomerForm.setData('last_name', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="new_phone">Telefone *</Label>
                                            <Input
                                                id="new_phone"
                                                value={newCustomerForm.data.phone}
                                                onChange={(e) => newCustomerForm.setData('phone', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="new_email">Email</Label>
                                            <Input
                                                id="new_email"
                                                type="email"
                                                value={newCustomerForm.data.email}
                                                onChange={(e) => newCustomerForm.setData('email', e.target.value)}
                                            />
                                        </div>

                                        <Button type="submit" size="sm" disabled={newCustomerForm.processing} className="w-full">
                                            <Plus className="mr-2 h-4 w-4" />
                                            {newCustomerForm.processing ? 'Criando...' : 'Criar e Selecionar'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Service Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scissors className="h-5 w-5" />
                                    Serviço
                                </CardTitle>
                                <CardDescription>Escolha o serviço a ser realizado</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="service_id">Serviço *</Label>
                                    <Select value={data.service_id} onValueChange={(value) => setData('service_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um serviço..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                    {service.name} - {service.duration_minutes}min - R$ {Number(service.price).toFixed(2)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.service_id && <p className="text-sm text-red-500">{errors.service_id}</p>}
                                </div>

                                {selectedService && (
                                    <div className="rounded-lg bg-muted p-3">
                                        <h4 className="font-semibold">{selectedService.name}</h4>
                                        <p className="text-sm text-muted-foreground">Duração: {selectedService.duration_minutes} minutos</p>
                                        <p className="text-sm text-muted-foreground">Preço: R$ {Number(selectedService.price).toFixed(2)}</p>
                                        {selectedService.description && (
                                            <p className="mt-1 text-sm text-muted-foreground">{selectedService.description}</p>
                                        )}
                                    </div>
                                )}

                                {services.length === 0 && (
                                    <div className="py-4 text-center">
                                        <p className="mb-2 text-muted-foreground">Nenhum serviço cadastrado</p>
                                        <Button variant="outline" asChild>
                                            <Link href="/services/create">Cadastrar Serviço</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Appointment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Detalhes do Agendamento
                            </CardTitle>
                            <CardDescription>Configure a data, hora e observações</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_at">Data e Hora *</Label>
                                    <Input
                                        id="scheduled_at"
                                        type="datetime-local"
                                        value={data.scheduled_at}
                                        onChange={(e) => setData('scheduled_at', e.target.value)}
                                        required
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    {errors.scheduled_at && <p className="text-sm text-red-500">{errors.scheduled_at}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount_code">Código de Desconto</Label>
                                    <Input
                                        id="discount_code"
                                        type="text"
                                        placeholder="Ex: DESCONTO20"
                                        value={data.discount_code}
                                        onChange={(e) => setData('discount_code', e.target.value.toUpperCase())}
                                    />
                                    {errors.discount_code && <p className="text-sm text-red-500">{errors.discount_code}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Adicione observações sobre o agendamento..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            {selectedService && data.scheduled_at && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h4 className="mb-2 font-semibold text-blue-900">Resumo do Agendamento</h4>
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <p>
                                            <strong>Serviço:</strong> {selectedService.name}
                                        </p>
                                        <p>
                                            <strong>Duração:</strong> {selectedService.duration_minutes} minutos
                                        </p>
                                        <p>
                                            <strong>Data/Hora:</strong> {new Date(data.scheduled_at).toLocaleString('pt-BR')}
                                        </p>
                                        <p>
                                            <strong>Preço:</strong> R$ {Number(selectedService.price).toFixed(2)}
                                        </p>
                                        {data.discount_code && (
                                            <p>
                                                <strong>Cupom:</strong> {data.discount_code}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" asChild>
                            <Link href="/appointments">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={processing || !data.customer_id || !data.service_id || !data.scheduled_at}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Criando...' : 'Criar Agendamento'}
                        </Button>
                    </div>
                </form>
            </div>
        </EstablishmentAppLayout>
    );
}
