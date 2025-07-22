import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, Tag, ChevronRight, Search, ShieldCheck, Info, Calendar as CalendarIcon, MessageCircle, User, Smartphone, XCircle, AlertTriangle } from 'lucide-react';
import TrackingScripts, { trackEvent, trackAddToCart, trackInitiateCheckout, trackPurchase } from '@/components/tracking-scripts';

// Enhanced Calendar Component with status indicators
const Calendar = ({
    mode,
    selected,
    onSelect,
    disabled,
    locale,
    className = '',
    getDayStatus, // Nova prop para obter status do dia
    onMonthChange, // Nova prop para quando o mês muda
}: {
    mode: 'single';
    selected?: Date;
    onSelect: (date: Date | undefined) => void;
    disabled: (date: Date) => boolean;
    locale: any;
    className?: string;
    getDayStatus?: (date: Date) => { available: boolean; status: 'past' | 'closed' | 'available' | 'blocked' };
    onMonthChange?: (year: number, month: number) => void;
}) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const changeMonth = (newMonth: Date) => {
        setCurrentMonth(newMonth);
        if (onMonthChange) {
            onMonthChange(newMonth.getFullYear(), newMonth.getMonth() + 1);
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    
    // Não permitir navegar para meses anteriores ao atual
    const isPreviousMonthDisabled = 
        currentMonth.getFullYear() <= currentYear && 
        currentMonth.getMonth() <= currentMonthIndex;

    // Limitar navegação futura (máximo 6 meses à frente)
    const maxFutureDate = new Date(currentYear, currentMonthIndex + 6, 1);
    const isNextMonthDisabled = 
        currentMonth.getFullYear() >= maxFutureDate.getFullYear() && 
        currentMonth.getMonth() >= maxFutureDate.getMonth();

    return (
        <div className={`p-3 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="outline"
                    size="icon"
                    disabled={isPreviousMonthDisabled}
                    onClick={() => changeMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className={isPreviousMonthDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                >
                    ←
                </Button>
                <h2 className="font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <Button
                    variant="outline"
                    size="icon"
                    disabled={isNextMonthDisabled}
                    onClick={() => changeMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className={isNextMonthDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                >
                    →
                </Button>
            </div>

            {/* Legenda dos status dos dias */}
            <div className="mb-4 flex flex-wrap justify-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Fechado</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>Já passou</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>Bloqueado</span>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-slate-500">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <div key={index} className="p-1">
                        {day && (() => {
                            const isSelected = selected && day.toDateString() === selected.toDateString();
                            const isDisabled = disabled(day);
                            const dayInfo = getDayStatus ? getDayStatus(day) : { available: !isDisabled, status: 'available' as const };
                            
                            // Determinar classes baseado no status
                            let statusClasses = '';
                            let textClasses = 'text-gray-700';
                            
                            if (isSelected) {
                                statusClasses = 'border-blue-500 bg-blue-500 text-white';
                                textClasses = 'text-white';
                            } else {
                                switch (dayInfo.status) {
                                    case 'available':
                                        statusClasses = 'border-green-300 bg-green-50 hover:bg-green-100';
                                        textClasses = 'text-green-700';
                                        break;
                                    case 'closed':
                                        statusClasses = 'border-red-300 bg-red-50 cursor-not-allowed';
                                        textClasses = 'text-red-500';
                                        break;
                                    case 'past':
                                        statusClasses = 'border-gray-300 bg-gray-50 cursor-not-allowed';
                                        textClasses = 'text-gray-400';
                                        break;
                                    case 'blocked':
                                        statusClasses = 'border-orange-300 bg-orange-50 cursor-not-allowed';
                                        textClasses = 'text-orange-500';
                                        break;
                                }
                            }
                            
                            return (
                                <Button
                                    variant="outline"
                                    className={`w-full h-8 p-0 text-sm relative ${statusClasses} ${textClasses} transition-all duration-200`}
                                    disabled={isDisabled}
                                    onClick={() => onSelect(day)}
                                >
                                    {day.getDate()}
                                    
                                    {/* Indicador visual no canto superior direito */}
                                    <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                                        dayInfo.status === 'available' ? 'bg-green-500' :
                                        dayInfo.status === 'closed' ? 'bg-red-500' :
                                        dayInfo.status === 'past' ? 'bg-gray-400' :
                                        'bg-orange-500'
                                    }`}></div>
                                </Button>
                            );
                        })()}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface Service {
    id: number;
    name: string;
    description: string;
    duration_minutes: number;
    price: number;
    has_promotion: boolean;
    promotion_price?: number;
    is_active: boolean;
}

interface Establishment {
    id: number;
    name: string;
    phone?: string;
    booking_slug?: string;
    booking_slogan?: string;
    booking_logo?: string;
    booking_banner?: string;
    booking_primary_color: string;
    booking_secondary_color: string;
    booking_theme: string;
    required_fields: string[] | Record<string, string> | null;
    working_hours: Record<string, any>;
    services: Service[];
    blockedDates?: Array<{
        id: number;
        blocked_date: string;
        is_recurring: boolean;
        reason?: string;
    }>;
    blockedTimes?: Array<{
        id: number;
        blocked_date: string;
        start_time: string;
        end_time: string;
        reason?: string;
    }>;
    // Payment settings
    booking_fee_enabled?: boolean;
    booking_fee_type?: 'fixed' | 'percentage';
    booking_fee_amount?: number;
    booking_fee_percentage?: number;
    mercadopago_access_token?: string;
    accepted_payment_methods?: string[];
    // Booking time restrictions
    earliest_booking_time?: string;
    latest_booking_time?: string;
}

interface TimeSlot {
    time: string;
    available: boolean;
    status: 'available' | 'occupied' | 'past' | 'blocked';
    isPast: boolean;
    datetime: string;
}

interface BookingPageProps {
    establishment: Establishment;
    timeSlots: TimeSlot[];
}

interface Payment {
    transaction_id: number;
    appointment_id: number;
    amount: number;
    qr_code: string;
    qr_code_base64: string;
    status: string;
    expires_at?: string;
    status_detail?: string;
}

// Utility functions
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const normalizeRequiredFields = (requiredFields: string[] | Record<string, string> | null): string[] => {
    if (!requiredFields) return ['name', 'phone'];
    if (Array.isArray(requiredFields)) return requiredFields;
    // If it's an object with numeric keys, convert to array
    return Object.values(requiredFields);
};


// Step Components
function Step1({ establishment, handleServiceSelect }: { establishment: Establishment; handleServiceSelect: (service: Service) => void }) {
    return (
        <div className="animate-in fade-in-0">
            <h2 className="text-lg font-semibold mb-4 text-center">1. Escolha o Serviço</h2>
            <div className="space-y-3">
                {establishment.services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="w-full text-left p-4 border rounded-lg hover:bg-slate-50 flex justify-between items-center transition-colors"
                    >
                        <div>
                            <p className="font-semibold">{service.name}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />{service.duration_minutes} min
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Tag className="h-4 w-4" />
                                    {service.has_promotion ? (
                                        <div className="flex items-center gap-2">
                                            <span className="line-through text-gray-400">
                                                {formatCurrency(Number(service.price || 0))}
                                            </span>
                                            <span className="text-green-600 font-semibold">
                                                {formatCurrency(Number(service.promotion_price || 0))}
                                            </span>
                                        </div>
                                    ) : (
                                        formatCurrency(Number(service.price || 0))
                                    )}
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    </button>
                ))}
            </div>
        </div>
    );
}

// Step 2: Date Selection
function Step2({
    setStep,
    selectedDate,
    handleDateSelect,
    isDayDisabled,
    handleProceedToTime,
    establishment,
    getDayStatus,
    loadDayAvailability,
}: {
    setStep: (step: number) => void;
    selectedDate: Date | undefined;
    handleDateSelect: (date: Date | undefined) => void;
    isDayDisabled: (date: Date) => boolean;
    handleProceedToTime: () => void;
    establishment: Establishment;
    getDayStatus: (date: Date) => { available: boolean; status: 'past' | 'closed' | 'available' | 'blocked' };
    loadDayAvailability: (year?: number, month?: number) => void;
}) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="animate-in fade-in-0">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold text-center w-full">2. Escolha a Data</h2>
            </div>

            {establishment.booking_fee_enabled && establishment.mercadopago_access_token && (
                <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Aviso:</strong> Para reservar seu horário é cobrado um sinal de{' '}
                        {establishment.booking_fee_type === 'fixed' 
                            ? formatCurrency(establishment.booking_fee_amount || 0)
                            : `${establishment.booking_fee_percentage}% do valor do serviço`
                        }.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col items-center gap-6">
                <div className="relative w-full">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={isDayDisabled}
                        locale={ptBR}
                        className="rounded-md border w-full"
                        getDayStatus={getDayStatus}
                        onMonthChange={(year, month) => {
                            // Carregar dados de disponibilidade apenas quando necessário
                            if (selectedService) {
                                loadDayAvailability(year, month);
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <Button onClick={handleProceedToTime} disabled={!selectedDate} className="btn-primary">
                    Próximo
                </Button>
            </div>
        </div>
    );
}

// Step 3: Time Selection
function Step3({
    setStep,
    selectedDate,
    selectedTime,
    setSelectedTime,
    timeSlots,
    handleProceedToDetails,
}: {
    setStep: (step: number) => void;
    selectedDate: Date | undefined;
    selectedTime: string | null;
    setSelectedTime: (time: string) => void;
    timeSlots: TimeSlot[];
    handleProceedToDetails: () => void;
}) {
    
    return (
        <div className="animate-in fade-in-0">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold text-center w-full">3. Escolha o Horário</h2>
            </div>

            <div className="w-full">
                <h3 className="font-medium text-center mb-4">
                    Horários Disponíveis - {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                </h3>
                {timeSlots.length === 0 ? (
                    <p className="text-center text-slate-500">Nenhum horário disponível para esta data.</p>
                ) : (
                    <>
                        {/* Legenda dos status */}
                        <div className="mb-4 flex flex-wrap justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-green-500"></div>
                                <span>Livre</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-red-500"></div>
                                <span>Ocupado</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-gray-400"></div>
                                <span>Já passou</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-orange-500"></div>
                                <span>Bloqueado</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {timeSlots.map((slot) => {
                                // Determinar cores baseado no status
                                let statusClasses = '';
                                let textClasses = 'text-gray-700';
                                
                                switch (slot.status) {
                                    case 'available':
                                        statusClasses = 'border-green-300 bg-green-50 hover:bg-green-100';
                                        textClasses = 'text-green-700';
                                        break;
                                    case 'occupied':
                                        statusClasses = 'border-red-300 bg-red-50 cursor-not-allowed';
                                        textClasses = 'text-red-500';
                                        break;
                                    case 'past':
                                        statusClasses = 'border-gray-300 bg-gray-50 cursor-not-allowed';
                                        textClasses = 'text-gray-400';
                                        break;
                                    case 'blocked':
                                        statusClasses = 'border-orange-300 bg-orange-50 cursor-not-allowed';
                                        textClasses = 'text-orange-500';
                                        break;
                                }
                                
                                // Se selecionado, usar estilo azul
                                if (selectedTime === slot.time && slot.available) {
                                    statusClasses = 'border-blue-500 bg-blue-500 text-white';
                                    textClasses = 'text-white';
                                }
                                
                                return (
                                    <Button
                                        key={slot.time}
                                        variant="outline"
                                        onClick={() => slot.available && setSelectedTime(slot.time)}
                                        disabled={!slot.available}
                                        className={`h-12 relative ${statusClasses} ${textClasses} transition-all duration-200`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">{slot.time}</span>
                                            {slot.status === 'occupied' && (
                                                <span className="text-xs opacity-75">Ocupado</span>
                                            )}
                                            {slot.status === 'past' && (
                                                <span className="text-xs opacity-75">Passou</span>
                                            )}
                                            {slot.status === 'blocked' && (
                                                <span className="text-xs opacity-75">Bloqueado</span>
                                            )}
                                        </div>
                                        
                                        {/* Indicador visual no canto superior direito */}
                                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                                            slot.status === 'available' ? 'bg-green-500' :
                                            slot.status === 'occupied' ? 'bg-red-500' :
                                            slot.status === 'past' ? 'bg-gray-400' :
                                            'bg-orange-500'
                                        }`}></div>
                                    </Button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-end mt-6">
                <Button onClick={handleProceedToDetails} disabled={!selectedTime} className="btn-primary">
                    Próximo
                </Button>
            </div>
        </div>
    );
}

// Step 4: Customer Details
function Step4({
    setStep,
    handleConfirmBooking,
    selectedService,
    selectedDate,
    selectedTime,
    isBooking,
    clientDetails,
    handleClientDetailsChange,
    handleSearchClient,
    isSearching,
    requiredFields,
    customerFound,
    clientFieldsVisible,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    isValidatingCoupon,
    validateCoupon,
    removeCoupon,
}: {
    setStep: (step: number) => void;
    handleConfirmBooking: (e: React.FormEvent) => void;
    selectedService: Service;
    selectedDate: Date | undefined;
    selectedTime: string | null;
    isBooking: boolean;
    clientDetails: any;
    handleClientDetailsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearchClient: () => void;
    isSearching: boolean;
    requiredFields: string[] | Record<string, string> | null;
    customerFound: boolean | null;
    clientFieldsVisible: boolean;
    couponCode: string;
    setCouponCode: (code: string) => void;
    appliedCoupon: any;
    couponError: string;
    isValidatingCoupon: boolean;
    validateCoupon: () => void;
    removeCoupon: () => void;
}) {
    const safeRequiredFields = normalizeRequiredFields(requiredFields);
    
    return (
        <div className="animate-in fade-in-0">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold text-center w-full">4. Seus Dados</h2>
            </div>

            <div className="p-4 border rounded-md bg-slate-50 mb-4">
                <p className="font-semibold">{selectedService.name}</p>
                <p className="text-sm text-slate-500">
                    Data: {selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}
                </p>
                <div className="mt-1">
                    {appliedCoupon ? (
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500 line-through">
                                {formatCurrency(appliedCoupon.original_price)}
                            </p>
                            <p className="text-sm text-green-600">
                                Desconto: -{formatCurrency(appliedCoupon.discount_amount)}
                            </p>
                            <p className="text-sm font-bold text-green-700">
                                Total: {formatCurrency(appliedCoupon.final_price)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 font-bold">
                            {selectedService.has_promotion
                                ? formatCurrency(Number(selectedService.promotion_price || 0))
                                : formatCurrency(Number(selectedService.price || 0))}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <Label htmlFor="telefone">Já é nosso cliente? Digite seu telefone</Label>
                <div className="flex gap-2">
                    <IMaskInput 
                        mask="(00) 00000-0000" 
                        id="telefone" 
                        value={clientDetails.telefone} 
                        onAccept={(value) => handleClientDetailsChange({ target: { id: 'telefone', value: String(value) } } as any)} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                        placeholder="(XX) XXXXX-XXXX"
                    />
                    <Button 
                        type="button" 
                        onClick={handleSearchClient} 
                        disabled={isSearching || clientFieldsVisible}
                        className="btn-primary"
                    >
                        <Search className="h-4 w-4"/>
                    </Button>
                </div>
                {isSearching && (
                    <p className="text-sm text-slate-500">Buscando dados do cliente...</p>
                )}
                {customerFound === true && (
                    <p className="text-sm text-green-600">✓ Cliente encontrado! Dados preenchidos automaticamente.</p>
                )}
                {customerFound === false && (
                    <p className="text-sm text-blue-600">Cliente não encontrado. Preencha os dados abaixo para cadastro.</p>
                )}
            </div>

            {clientFieldsVisible && (
                <form onSubmit={handleConfirmBooking} className="space-y-4 animate-in fade-in-0">
                
                {/* Cupom de Desconto */}
                <div className="space-y-2 p-3 border rounded-md bg-blue-50">
                    <Label htmlFor="coupon">Cupom de Desconto (opcional)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="coupon"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Digite o código do cupom"
                            className="flex-1"
                        />
                        <Button 
                            type="button" 
                            onClick={validateCoupon}
                            disabled={isValidatingCoupon || !couponCode.trim()}
                            variant="outline"
                        >
                            {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                        </Button>
                    </div>
                    {couponError && (
                        <p className="text-sm text-red-600">{couponError}</p>
                    )}
                    {appliedCoupon && (
                        <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 p-2 rounded">
                            <span>✓ Cupom aplicado: {appliedCoupon.discount_text}</span>
                            <Button 
                                type="button" 
                                onClick={removeCoupon}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                            >
                                Remover
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input id="name" value={clientDetails.name} onChange={handleClientDetailsChange} required />
                    </div>
                    {safeRequiredFields.includes('last_name') && (
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Sobrenome {safeRequiredFields.includes('last_name') ? '*' : ''}</Label>
                            <Input
                                id="last_name"
                                value={clientDetails.last_name}
                                onChange={handleClientDetailsChange}
                                required={safeRequiredFields.includes('last_name')}
                            />
                        </div>
                    )}
                </div>
                {safeRequiredFields.includes('email') && (
                    <div className="space-y-2">
                        <Label htmlFor="email">Email {safeRequiredFields.includes('email') ? '*' : ''}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={clientDetails.email}
                            onChange={handleClientDetailsChange}
                            required={safeRequiredFields.includes('email')}
                        />
                    </div>
                )}
                {safeRequiredFields.includes('birth_date') && (
                    <div className="space-y-2">
                        <Label htmlFor="birth_date">Data de Nascimento {safeRequiredFields.includes('birth_date') ? '*' : ''}</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={clientDetails.birth_date}
                            onChange={handleClientDetailsChange}
                            required={safeRequiredFields.includes('birth_date')}
                        />
                    </div>
                )}
                    <div className="flex justify-end mt-6">
                        <Button type="submit" className="w-full btn-primary" disabled={isBooking}>
                            {isBooking ? 'Finalizando...' : 'Finalizar Agendamento'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

// Step 5: Success
function Step5({ 
    setStep, 
    selectedService, 
    selectedDate, 
    selectedTime,
    clientDetails,
    establishment
}: {
    setStep: (step: number) => void;
    selectedService: Service;
    selectedDate: Date | undefined;
    selectedTime: string | null;
    clientDetails: any;
    establishment: Establishment;
}) {
    return (
        <div className="animate-in fade-in-0 text-center">
            <div className="p-4 border rounded-md bg-green-50 border-green-200 mb-6">
                <ShieldCheck className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h2 className="text-lg font-semibold text-green-800 mb-2">Agendamento Confirmado!</h2>
                <p className="text-sm text-green-700">Seu agendamento foi realizado com sucesso.</p>
            </div>

            <div className="space-y-4 text-left">
                <div className="p-4 border rounded-md">
                    <h3 className="font-semibold mb-2">Detalhes do Agendamento</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Serviço:</strong> {selectedService.name}</p>
                        <p><strong>Data:</strong> {selectedDate?.toLocaleDateString('pt-BR')}</p>
                        <p><strong>Horário:</strong> {selectedTime}</p>
                        <p><strong>Cliente:</strong> {clientDetails.name} {clientDetails.last_name}</p>
                        <p><strong>Telefone:</strong> {clientDetails.telefone}</p>
                        {clientDetails.email && <p><strong>Email:</strong> {clientDetails.email}</p>}
                    </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Você receberá uma confirmação por WhatsApp em breve. 
                        Chegue com 10 minutos de antecedência.
                    </AlertDescription>
                </Alert>
            </div>

            <div className="space-y-3 mt-6">
                {/* Adicionar ao Calendário */}
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        variant="outline"
                        onClick={() => {
                            const startDate = new Date(`${format(selectedDate!, 'yyyy-MM-dd')}T${selectedTime}:00`);
                            const endDate = new Date(startDate.getTime() + (selectedService.duration_minutes * 60000));
                            
                            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedService.name)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(`Agendamento confirmado para ${selectedService.name}`)}`;
                            
                            window.open(googleCalendarUrl, '_blank');
                        }}
                        className="flex items-center gap-2"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Google Calendar
                    </Button>
                    
                    <Button 
                        variant="outline"
                        onClick={() => {
                            const startDate = new Date(`${format(selectedDate!, 'yyyy-MM-dd')}T${selectedTime}:00`);
                            const endDate = new Date(startDate.getTime() + (selectedService.duration_minutes * 60000));
                            
                            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Horaly//Agendamento//PT
BEGIN:VEVENT
UID:${Date.now()}@horaly.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${selectedService.name}
DESCRIPTION:Agendamento confirmado para ${selectedService.name}
END:VEVENT
END:VCALENDAR`;
                            
                            const blob = new Blob([icsContent], { type: 'text/calendar' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'agendamento.ics';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Apple Calendar
                    </Button>
                </div>

                {/* Contato WhatsApp */}
                <Button 
                    variant="outline"
                    onClick={() => {
                        const message = `Olá! Acabei de confirmar meu agendamento para ${selectedService.name} no dia ${selectedDate?.toLocaleDateString('pt-BR')} às ${selectedTime}. Gostaria de confirmar os detalhes.`;
                        // Remove caracteres não numéricos do telefone
                        const cleanPhone = establishment.phone?.replace(/\D/g, '') || '';
                        const whatsappUrl = cleanPhone 
                            ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
                            : `https://wa.me/?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                    }}
                    className="w-full flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                    <MessageCircle className="h-4 w-4" />
                    Contato via WhatsApp
                </Button>

                {/* Botões de ação principais */}
                <div className="grid grid-cols-1 gap-3">
                    <Button 
                        variant="outline"
                        onClick={() => {
                            window.open('/customer/login', '_blank');
                        }}
                        className="w-full flex items-center gap-2"
                    >
                        <User className="h-4 w-4" />
                        Meus Agendamentos
                    </Button>
                    
                    <Button 
                        className="w-full btn-primary" 
                        onClick={() => {
                            setStep(1);
                            window.location.reload();
                        }}
                    >
                        Fazer Novo Agendamento
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Step 7: Payment Failed / Appointment Cancelled
function Step7({ 
    setStep, 
    selectedService, 
    selectedDate, 
    selectedTime,
    clientDetails,
    establishment,
    payment
}: {
    setStep: (step: number) => void;
    selectedService: Service;
    selectedDate: Date | undefined;
    selectedTime: string | null;
    clientDetails: any;
    establishment: Establishment;
    payment: Payment | null;
}) {
    return (
        <div className="animate-in fade-in-0 text-center">
            <div className="p-4 border rounded-md bg-red-50 border-red-200 mb-6">
                <XCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
                <h2 className="text-lg font-semibold text-red-800 mb-2">Agendamento Cancelado</h2>
                <p className="text-sm text-red-700">Seu agendamento foi cancelado devido a falha no pagamento.</p>
            </div>

            <div className="space-y-4 text-left">
                <div className="p-4 border rounded-md">
                    <h3 className="font-semibold mb-2">Detalhes do Agendamento Cancelado</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Serviço:</strong> {selectedService.name}</p>
                        <p><strong>Data:</strong> {selectedDate?.toLocaleDateString('pt-BR')}</p>
                        <p><strong>Horário:</strong> {selectedTime}</p>
                        <p><strong>Cliente:</strong> {clientDetails.name} {clientDetails.last_name}</p>
                        <p><strong>Telefone:</strong> {clientDetails.telefone}</p>
                        {clientDetails.email && <p><strong>Email:</strong> {clientDetails.email}</p>}
                    </div>
                </div>

                {payment && (
                    <div className="p-4 border rounded-md bg-red-50 border-red-200">
                        <h3 className="font-semibold mb-2 text-red-800">Detalhes do Pagamento</h3>
                        <div className="space-y-1 text-sm text-red-700">
                            <p><strong>Status:</strong> Rejeitado</p>
                            <p><strong>Valor:</strong> R$ {payment.amount}</p>
                            {payment.status_detail && (
                                <p><strong>Motivo:</strong> {payment.status_detail}</p>
                            )}
                        </div>
                    </div>
                )}

                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        O pagamento foi rejeitado e o agendamento foi cancelado automaticamente. 
                        Você pode tentar novamente ou entrar em contato conosco.
                    </AlertDescription>
                </Alert>
            </div>

            <div className="space-y-3 mt-6">
                <Button 
                    className="w-full btn-primary" 
                    onClick={() => {
                        setStep(1);
                        window.location.reload();
                    }}
                >
                    Tentar Novamente
                </Button>
                
                <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                        window.location.href = `tel:${establishment.phone}`;
                    }}
                >
                    Entrar em Contato
                </Button>
            </div>
        </div>
    );
}

// Step 6: Payment
function Step6({
    setStep,
    selectedService,
    selectedDate,
    selectedTime,
    clientDetails,
    establishment,
    appliedCoupon,
    payment,
    setPayment,
    isProcessingPayment,
    setIsProcessingPayment,
    paymentStatus,
    setPaymentStatus,
    createAppointment,
}: {
    setStep: (step: number) => void;
    selectedService: Service;
    selectedDate: Date | undefined;
    selectedTime: string | null;
    clientDetails: any;
    establishment: Establishment;
    appliedCoupon: any;
    payment: Payment | null;
    setPayment: (payment: Payment | null) => void;
    isProcessingPayment: boolean;
    setIsProcessingPayment: (loading: boolean) => void;
    paymentStatus: 'pending' | 'checking' | 'approved' | 'rejected';
    setPaymentStatus: (status: 'pending' | 'checking' | 'approved' | 'rejected') => void;
}) {
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [selectedPaymentMethod] = useState<'pix' | null>('pix');
    const [showQRCode, setShowQRCode] = useState<boolean>(false);
    const [appointmentCreated, setAppointmentCreated] = useState<any>(null);

    useEffect(() => {
        // Calculate payment amount
        if (selectedService && establishment.booking_fee_enabled) {
            let basePrice = selectedService.promotion_price || selectedService.price;
            
            // Apply coupon discount to base price first
            if (appliedCoupon) {
                const discount = appliedCoupon.type === 'percentage' 
                    ? (basePrice * appliedCoupon.value) / 100
                    : appliedCoupon.value;
                basePrice = Math.max(0, basePrice - discount);
            }
            
            // Calculate fee amount
            let feeAmount = 0;
            if (establishment.booking_fee_type === 'fixed') {
                feeAmount = establishment.booking_fee_amount || 0;
            } else {
                // Percentage
                const percentage = establishment.booking_fee_percentage || 50;
                feeAmount = (basePrice * percentage) / 100;
            }
            
            setPaymentAmount(feeAmount);
        }
    }, [selectedService, establishment, appliedCoupon]);

    const handleCreateAppointment = async () => {
        setIsProcessingPayment(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // Create the appointment first
            const appointmentResponse = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    establishment_id: establishment.id,
                    service_id: selectedService.id,
                    scheduled_at: `${format(selectedDate!, 'yyyy-MM-dd')} ${selectedTime}:00`,
                    customer: {
                        ...clientDetails,
                        phone: clientDetails.telefone,
                    },
                    coupon_code: appliedCoupon?.code || null,
                }),
            });

            const appointmentData = await appointmentResponse.json();
            
            if (!appointmentResponse.ok) {
                console.error('Appointment creation failed:', appointmentData);
                toast.error(appointmentData.message || 'Erro ao criar agendamento');
                return;
            }

            setAppointmentCreated(appointmentData.appointment);
            toast.success('Agendamento criado! Selecione o método de pagamento para confirmar.');
            
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error('Erro ao criar agendamento');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleCreatePayment = async () => {
        if (!selectedPaymentMethod || !appointmentCreated) {
            toast.error('Selecione um método de pagamento');
            return;
        }


        setIsProcessingPayment(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const endpoint = '/api/booking-payment/pix';
            
            const requestBody: any = {
                appointment_id: appointmentCreated.id,
                customer_name: clientDetails.name,
                customer_email: clientDetails.email,
                customer_phone: clientDetails.telefone,
            };

            
            const paymentResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify(requestBody),
            });

            const paymentData = await paymentResponse.json();
            
            if (paymentResponse.ok && paymentData.success) {
                // Pagamento aprovado
                setPayment(paymentData.data);
                setPaymentStatus('approved');
                setShowQRCode(false);
                
                startPaymentPolling(paymentData.data.transaction_id);
            } else {
                // Pagamento rejeitado ou erro
                setPayment(paymentData.data || null);
                setPaymentStatus('rejected');
                
                if (paymentData.data?.appointment_status === 'cancelled') {
                    toast.error(paymentData.message || 'Pagamento rejeitado');
                    // Redirecionar direto para tela de agendamento cancelado
                    setTimeout(() => setStep(7), 1000); // Step 7 será a tela de cancelamento
                } else {
                    toast.error(paymentData.message || 'Erro ao criar pagamento PIX');
                }
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            toast.error('Erro ao criar pagamento PIX');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const startPaymentPolling = (transactionId: number) => {
        setPaymentStatus('checking');
        
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/booking-payment/status/${transactionId}`);
                const data = await response.json();
                
                if (response.ok) {
                    if (data.data.status === 'paid') {
                        setPaymentStatus('approved');
                        clearInterval(pollInterval);
                        toast.success('Pagamento aprovado! Agendamento confirmado.');
                        setStep(5); // Success step
                    } else if (data.data.status === 'cancelled') {
                        setPaymentStatus('rejected');
                        clearInterval(pollInterval);
                        toast.error('Pagamento rejeitado');
                        setTimeout(() => setStep(7), 1000); // Redirect to cancellation screen
                    }
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 3000); // Check every 3 seconds

        // Stop polling after 10 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            if (paymentStatus === 'checking') {
                setPaymentStatus('pending');
            }
        }, 600000);
    };

    return (
        <div className="animate-in fade-in-0">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setStep(4)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold text-center w-full">6. Pagamento</h2>
            </div>

            <div className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Resumo do Pagamento</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Serviço:</span>
                            <span>{selectedService.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Valor total:</span>
                            <span>{formatCurrency((selectedService.promotion_price || selectedService.price) - (appliedCoupon?.discount_amount || 0))}</span>
                        </div>
                        <div className="flex justify-between font-medium text-lg border-t pt-2">
                            <span>Sinal a pagar:</span>
                            <span className="text-blue-600">{formatCurrency(paymentAmount)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            {establishment.booking_fee_type === 'fixed' 
                                ? `Valor fixo de ${formatCurrency(establishment.booking_fee_amount || 0)}`
                                : `${establishment.booking_fee_percentage}% do valor do serviço`
                            }
                        </p>
                    </div>
                </div>

                {/* Create appointment first */}
                {!appointmentCreated && (
                    <Button 
                        onClick={handleCreateAppointment} 
                        disabled={isProcessingPayment}
                        className="w-full btn-primary"
                    >
                        {isProcessingPayment ? 'Criando agendamento...' : 'Continuar para Pagamento'}
                    </Button>
                )}

                {/* Payment method selection */}
                {appointmentCreated && !payment && (
                    <div className="space-y-4">
                        <h3 className="font-medium">Selecione o método de pagamento:</h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg flex items-center gap-3">
                                <Smartphone className="h-5 w-5 text-blue-600" />
                                <div className="text-left">
                                    <p className="font-medium">PIX</p>
                                    <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleCreatePayment} 
                                disabled={isProcessingPayment}
                                className="w-full btn-primary"
                            >
                                {isProcessingPayment ? 'Processando...' : 'Pagar com PIX'}
                            </Button>
                        </div>
                        
                    </div>
                )}

                {/* PIX Payment Display */}
                {payment && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="bg-white p-4 rounded-lg border">
                                {!showQRCode ? (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                            <Smartphone className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">
                                            QR Code PIX gerado com sucesso
                                        </p>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setShowQRCode(true)}
                                            className="w-full mb-4"
                                        >
                                            Mostrar QR Code
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <img 
                                            src={`data:image/png;base64,${payment.qr_code_base64}`}
                                            alt="QR Code PIX"
                                            className="mx-auto mb-4"
                                        />
                                        <p className="text-sm text-gray-600 mb-2">
                                            Escaneie o QR Code acima ou copie o código PIX abaixo
                                        </p>
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowQRCode(false)}
                                            className="text-gray-500 mb-4"
                                        >
                                            Ocultar QR Code
                                        </Button>
                                    </>
                                )}

                                {/* Campo de código PIX sempre visível */}
                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Ou copie o código PIX:
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            value={payment.qr_code}
                                            readOnly
                                            className="text-xs"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(payment.qr_code);
                                                toast.success('Código PIX copiado!');
                                            }}
                                        >
                                            Copiar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {paymentStatus === 'checking' && (
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 text-blue-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Aguardando pagamento...</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Verificando o pagamento automaticamente
                                </p>
                            </div>
                        )}

                        {paymentStatus === 'approved' && (
                            <div className="text-center text-green-600">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                                    <span>Pagamento aprovado!</span>
                                </div>
                            </div>
                        )}

                        {paymentStatus === 'rejected' && (
                            <div className="text-center text-red-600">
                                <span>Pagamento rejeitado</span>
                                <Button 
                                    variant="outline" 
                                    onClick={handleCreatePayment}
                                    className="mt-2 w-full"
                                    disabled={isProcessingPayment}
                                >
                                    Tentar novamente
                                </Button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

// Declare global interface for window cache
declare global {
    interface Window {
        _availabilityCache?: Record<string, boolean>;
    }
}

// Generate time slots based on establishment working hours and service duration

export default function BookingPage({ establishment, timeSlots: initialTimeSlots }: BookingPageProps) {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots || []);
    const [dayAvailability, setDayAvailability] = useState<Record<string, string>>({});
    const [clientDetails, setClientDetails] = useState({
        name: '',
        last_name: '',
        email: '',
        telefone: '',
        birth_date: '',
    });
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [customerFound, setCustomerFound] = useState<boolean | null>(null);
    const [clientFieldsVisible, setClientFieldsVisible] = useState(false);
    
    // Payment states
    const [payment, setPayment] = useState<Payment | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'approved' | 'rejected'>('pending');

    const calculateEarliestBookingDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const earliestSetting = establishment.earliest_booking_time;

        if (!earliestSetting || earliestSetting === 'same_day') {
            return today; // Allow same day booking if no restriction
        }

        switch (earliestSetting) {
            case '+1 day':
                return addDays(today, 1);
            case '+2 days':
                return addDays(today, 2);
            case '+3 days':
                return addDays(today, 3);
            case '+7 days':
                return addDays(today, 7);
            case '+1 month':
                return addDays(today, 30);
            case 'next_week':
                // Next Monday
                const nextMonday = new Date(today);
                nextMonday.setDate(today.getDate() + (7 - today.getDay() + 1) % 7);
                return nextMonday;
            case 'next_month':
                // First day of next month
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                return nextMonth;
            default:
                return today;
        }
    };

    const calculateLatestBookingDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const latestSetting = establishment.latest_booking_time;

        if (!latestSetting || latestSetting === 'no_limit') {
            return null; // No limit
        }

        switch (latestSetting) {
            case '+1 week':
                return addDays(today, 7);
            case '+2 weeks':
                return addDays(today, 14);
            case '+1 month':
                return addDays(today, 30);
            case '+2 months':
                return addDays(today, 60);
            case '+3 months':
                return addDays(today, 90);
            case '+6 months':
                return addDays(today, 180);
            default:
                return null;
        }
    };

    const isDayDisabled = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Always disable past dates
        if (date < today) return true;

        // Apply earliest booking time restriction
        const earliestAllowed = calculateEarliestBookingDate();
        if (date < earliestAllowed) return true;

        // Apply latest booking time restriction
        const latestAllowed = calculateLatestBookingDate();
        if (latestAllowed && date > latestAllowed) return true;
        
        // Check day availability from API if available
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayStatus = dayAvailability[dateKey];
        if (dayStatus) {
            return dayStatus === 'past' || dayStatus === 'closed' || dayStatus === 'blocked';
        }

        // Check if working_hours exists and is properly structured
        if (!establishment.working_hours || typeof establishment.working_hours !== 'object') {
            return false; // If no working hours defined, allow all days
        }

        // Create default working hours if none exist
        const defaultWorkingHours: Record<string, any> = {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '18:00' },
            saturday: { start: '09:00', end: '16:00' },
            sunday: null,
        };

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[date.getDay()];
        const workingHours = establishment.working_hours[dayKey] || defaultWorkingHours[dayKey];
        
        // Only disable days that have no working hours (establishment is closed)
        // Check for both null and objects with is_open: false
        return workingHours === null || 
               workingHours === undefined || 
               (typeof workingHours === 'object' && workingHours?.is_open === false);
    };

    // Remover seleção automática por enquanto para eliminar qualquer possível loop
    // useEffect(() => {
    //     if (!selectedDate && selectedService && Object.keys(dayAvailability).length > 0) {
    //         const findNextAvailableDate = () => {
    //             let currentDate = new Date();
    //             currentDate.setHours(0, 0, 0, 0);
    //             let attempts = 0;
    //             const maxAttempts = 30;
                
    //             while (attempts < maxAttempts) {
    //                 const dateKey = format(currentDate, 'yyyy-MM-dd');
    //                 const dayStatus = dayAvailability[dateKey];
                    
    //                 if (dayStatus === 'available') {
    //                     return currentDate;
    //                 }
                    
    //                 currentDate = addDays(currentDate, 1);
    //                 attempts++;
    //             }
                
    //             return undefined;
    //         };
            
    //         const nextDate = findNextAvailableDate();
    //         if (nextDate) {
    //             setSelectedDate(nextDate);
    //         }
    //     }
    // }, [selectedService?.id, dayAvailability, selectedDate]);

    useEffect(() => {
        if (selectedDate && selectedService) {
            loadAvailableTimeSlots();
        }
    }, [selectedDate, selectedService?.id]); // Usar apenas o ID para evitar loops

    // Load time slots when step 3 is reached
    useEffect(() => {
        if (step === 3 && selectedDate && selectedService) {
            loadAvailableTimeSlots();
        }
    }, [step]);

    const loadAvailableTimeSlots = async () => {
        if (!selectedDate || !selectedService) return;

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const currentPath = window.location.pathname;
            const slug = currentPath.split('/').filter(Boolean).pop();
            
            console.log('Loading time slots for:', { dateStr, serviceId: selectedService.id, slug });
            
            const response = await fetch(`/api/available-times?date=${dateStr}&service_id=${selectedService.id}&establishment_slug=${slug}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);
                setTimeSlots(data.timeSlots || []);
            } else {
                console.error('API Error:', response.status, response.statusText);
                setTimeSlots([]);
            }
        } catch (error) {
            console.error('Error loading time slots:', error);
            setTimeSlots([]);
        }
    };


    const loadDayAvailability = async (year?: number, month?: number) => {
        // Função simplificada apenas para carregar quando necessário
        if (!selectedService) return;
        
        const currentDate = new Date();
        const targetYear = year || currentDate.getFullYear();
        const targetMonth = month || (currentDate.getMonth() + 1);
        
        try {
            const currentPath = window.location.pathname;
            const slug = currentPath.split('/').filter(Boolean).pop();
            
            const response = await fetch(`/api/day-availability?service_id=${selectedService.id}&establishment_slug=${slug}&year=${targetYear}&month=${targetMonth}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
            });
            
            if (response.ok) {
                const data = await response.json();
                setDayAvailability(prev => ({ ...prev, ...data.dayStatus }));
            }
        } catch (error) {
            console.error('Error loading day availability:', error);
        }
    };

    // Limpar dados quando trocar de serviço
    useEffect(() => {
        if (selectedService) {
            setDayAvailability({});
        }
    }, [selectedService?.id]);

    const getDayStatus = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const status = dayAvailability[dateKey] || 'available';
        
        // Map API status to component status
        const statusMapping = {
            'available': 'available' as const,
            'unavailable': 'closed' as const,
            'closed': 'closed' as const,
            'past': 'past' as const,
            'blocked': 'blocked' as const,
        };
        
        const mappedStatus = statusMapping[status as keyof typeof statusMapping] || 'available';
        
        return {
            available: mappedStatus === 'available',
            status: mappedStatus,
        };
    };

    const validateCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('');
            setAppliedCoupon(null);
            return;
        }

        setIsValidatingCoupon(true);
        setCouponError('');

        try {
            const currentPath = window.location.pathname;
            const slug = currentPath.split('/').filter(Boolean).pop();
            const response = await fetch(`/api/booking/validate-coupon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    code: couponCode,
                    establishment_slug: slug,
                    service_id: selectedService?.id,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setAppliedCoupon(data.coupon);
                    setCouponError('');
                    toast.success(`Cupom aplicado! Desconto: ${data.coupon.discount_text}`);
                } else {
                    setCouponError(data.message || 'Cupom inválido');
                    setAppliedCoupon(null);
                }
            } else {
                setCouponError('Erro ao validar cupom');
                setAppliedCoupon(null);
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponError('Erro ao validar cupom');
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setStep(2);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date && !isDayDisabled(date)) {
            setSelectedDate(date);
            setSelectedTime(null);
        }
    };

    const handleClientDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setClientDetails((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSearchClient = async () => {
        const phone = clientDetails.telefone.replace(/\D/g, '');
        
        if (phone.length >= 10) {
            setIsSearching(true);
            
            try {
                const response = await fetch(`/api/booking/customers/search?phone=${clientDetails.telefone}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    credentials: 'same-origin',
                });
                
                let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('Failed to parse customer search response as JSON:', jsonError);
                    setIsSearching(false);
                    return;
                }

                if (data.customer) {
                    // Format birth_date for HTML date input (YYYY-MM-DD)
                    let formattedBirthDate = '';
                    if (data.customer.birth_date) {
                        formattedBirthDate = data.customer.birth_date.split('T')[0]; // Extract YYYY-MM-DD from ISO date
                    }
                    
                    setClientDetails((prev) => ({
                        ...prev,
                        name: data.customer.name || '',
                        last_name: data.customer.last_name || '',
                        email: data.customer.email || '',
                        birth_date: formattedBirthDate,
                    }));
                    setCustomerFound(true);
                    setClientFieldsVisible(true);
                    toast.success('Cliente encontrado! Dados preenchidos automaticamente.');
                } else {
                    setCustomerFound(false);
                    setClientFieldsVisible(true);
                    toast.info('Cliente não encontrado. Preencha os dados abaixo.');
                }
            } catch (error) {
                console.error('Error searching client:', error);
                setCustomerFound(false);
                setClientFieldsVisible(true);
                toast.error('Erro ao buscar cliente. Preencha os dados manualmente.');
            } finally {
                setIsSearching(false);
            }
        } else {
            toast.error('Digite um telefone válido com pelo menos 10 dígitos.');
        }
    };

    const handleProceedToTime = () => {
        setStep(3);
        // Time slots will be loaded by the useEffect when step 3 is reached
    };

    const handleProceedToDetails = () => {
        // Reset customer search states when entering Step 4
        if (!clientDetails.telefone) {
            setCustomerFound(null);
            setClientFieldsVisible(false);
        }
        setStep(4);
    };

    const handleConfirmBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if payment is required
        if (establishment.booking_fee_enabled && establishment.mercadopago_access_token) {
            // Go to payment step
            setStep(6);
        } else {
            // Create appointment directly (no payment required)
            await createAppointment();
        }
    };

    const createAppointment = async () => {
        setIsBooking(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    establishment_id: establishment.id,
                    service_id: selectedService?.id,
                    scheduled_at: `${format(selectedDate!, 'yyyy-MM-dd')} ${selectedTime}:00`,
                    customer: {
                        ...clientDetails,
                        phone: clientDetails.telefone,
                    },
                    coupon_code: appliedCoupon?.code || null,
                }),
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', jsonError);
                toast.error('Erro de comunicação com o servidor.');
                return;
            }

            if (response.ok) {
                toast.success('Agendamento confirmado!');
                setStep(5);
            } else {
                toast.error(data.message || 'Erro ao confirmar agendamento.');
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            toast.error('Erro ao confirmar agendamento.');
        } finally {
            setIsBooking(false);
        }
    };

    if (!establishment) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-t-2 border-r-2 border-slate-900 rounded-full"></div>
            </div>
        );
    }

    const establishmentInitial = establishment.name.charAt(0).toUpperCase();

    return (
        <>
            <Head title={`Agendamento - ${establishment.name}`} />
            <style dangerouslySetInnerHTML={{
                __html: `
                    :root {
                        --primary-color: ${establishment.booking_primary_color};
                        --secondary-color: ${establishment.booking_secondary_color};
                    }
                    .btn-primary {
                        background-color: var(--primary-color) !important;
                        border-color: var(--primary-color) !important;
                    }
                    .btn-primary:hover {
                        background-color: var(--secondary-color) !important;
                        border-color: var(--secondary-color) !important;
                    }
                    .text-primary {
                        color: var(--primary-color) !important;
                    }
                    .border-primary {
                        border-color: var(--primary-color) !important;
                    }
                    .bg-primary {
                        background-color: var(--primary-color) !important;
                    }
                `
            }} />
            
            <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md overflow-hidden rounded-xl p-0">
                    {establishment.booking_banner && (
                        <div className="relative w-full h-40">
                            <img
                                src={`/storage/${establishment.booking_banner}`}
                                alt={`Capa de ${establishment.name}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6 flex flex-col items-center text-center relative -mt-16">
                        <Avatar className="h-24 w-24 border-4 border-white bg-slate-100">
                            {establishment.booking_logo ? (
                                <AvatarImage 
                                    src={`/storage/${establishment.booking_logo}`} 
                                    alt={establishment.name} 
                                />
                            ) : (
                                <AvatarFallback className="text-3xl">{establishmentInitial}</AvatarFallback>
                            )}
                        </Avatar>
                        <h1 className="text-2xl font-bold mt-4 text-primary">{establishment.name}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {establishment.booking_slogan || 'A sua beleza é a nossa prioridade.'}
                        </p>
                    </div>

                    <div className="px-6 pb-8 pt-0">
                        <Separator className="my-8" />
                        <div className="animate-in fade-in-0">
                            {step === 1 && (
                                <Step1 
                                    establishment={establishment} 
                                    handleServiceSelect={handleServiceSelect} 
                                />
                            )}
                            {step === 2 && (
                                <Step2
                                    setStep={setStep}
                                    selectedDate={selectedDate}
                                    handleDateSelect={handleDateSelect}
                                    isDayDisabled={isDayDisabled}
                                    handleProceedToTime={handleProceedToTime}
                                    establishment={establishment}
                                    getDayStatus={getDayStatus}
                                    loadDayAvailability={loadDayAvailability}
                                />
                            )}
                            {step === 3 && selectedDate && selectedService && (
                                <Step3
                                    setStep={setStep}
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    setSelectedTime={setSelectedTime}
                                    timeSlots={timeSlots}
                                    handleProceedToDetails={handleProceedToDetails}
                                />
                            )}
                            {step === 4 && selectedService && (
                                <Step4
                                    setStep={setStep}
                                    handleConfirmBooking={handleConfirmBooking}
                                    selectedService={selectedService}
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    isBooking={isBooking}
                                    clientDetails={clientDetails}
                                    handleClientDetailsChange={handleClientDetailsChange}
                                    handleSearchClient={handleSearchClient}
                                    isSearching={isSearching}
                                    requiredFields={establishment.required_fields}
                                    customerFound={customerFound}
                                    clientFieldsVisible={clientFieldsVisible}
                                    couponCode={couponCode}
                                    setCouponCode={setCouponCode}
                                    appliedCoupon={appliedCoupon}
                                    couponError={couponError}
                                    isValidatingCoupon={isValidatingCoupon}
                                    validateCoupon={validateCoupon}
                                    removeCoupon={removeCoupon}
                                />
                            )}
                            {step === 5 && selectedService && (
                                <Step5
                                    setStep={setStep}
                                    selectedService={selectedService}
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    clientDetails={clientDetails}
                                    establishment={establishment}
                                />
                            )}
                            {step === 6 && selectedService && (
                                <Step6
                                    setStep={setStep}
                                    selectedService={selectedService}
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    clientDetails={clientDetails}
                                    establishment={establishment}
                                    appliedCoupon={appliedCoupon}
                                    payment={payment}
                                    setPayment={setPayment}
                                    isProcessingPayment={isProcessingPayment}
                                    setIsProcessingPayment={setIsProcessingPayment}
                                    paymentStatus={paymentStatus}
                                    setPaymentStatus={setPaymentStatus}
                                />
                            )}
                            {step === 7 && selectedService && (
                                <Step7
                                    setStep={setStep}
                                    selectedService={selectedService}
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    clientDetails={clientDetails}
                                    establishment={establishment}
                                    payment={payment}
                                />
                            )}
                        </div>
                    </div>
                </Card>
            </main>
        </>
    );
}