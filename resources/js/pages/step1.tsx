import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Clock, PartyPopper } from 'lucide-react';
import { useState } from 'react';

// Mock Data
const services = [
    { id: 1, name: 'Preenchimento Labial', duration: 30, price: 399.9 },
    { id: 2, name: 'Micro Labial', duration: 30, price: 259.9 },
    { id: 3, name: 'Preenchimento de Glúteo', duration: 30, price: 1599.9 },
    { id: 4, name: 'Aplicação de Botox', duration: 45, price: 899.0 },
];
const availableTimes = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
];

// Componentes da UI (Simulando shadcn/ui com tema Champagne & Charcoal)
const Card = ({ children, className = '' }) => <div className={`overflow-hidden rounded-xl bg-white shadow-md ${className}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;
const Button = ({ children, onClick, className = '', variant = 'default', disabled = false }) => {
    const baseClasses =
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
        default: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-600',
        outline: 'border border-gray-300 bg-transparent hover:bg-amber-50 text-slate-800 focus:ring-amber-400',
        ghost: 'hover:bg-amber-100 text-slate-800',
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};
const Input = (props) => (
    <input
        {...props}
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none ${props.className}`}
    />
);

// Componente do Calendário
const Calendar = ({ selectedDate, onDateChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 5));
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));
    const dates = [];
    const date = new Date(startDate);
    while (date <= endDate) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    const isSameDay = (d1, d2) =>
        d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    return (
        <div className="p-3">
            <div className="mb-4 flex items-center justify-between">
                <Button onClick={handlePrevMonth} variant="ghost" className="h-8 w-8 p-0">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h3 className="text-lg font-semibold text-gray-800">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <Button onClick={handleNextMonth} variant="ghost" className="h-8 w-8 p-0">
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-sm text-gray-500">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {dates.map((d, i) => (
                    <button
                        key={i}
                        onClick={() => onDateChange(d)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isSameDay(d, selectedDate) ? 'bg-slate-800 text-white' : ''} ${!isSameDay(d, selectedDate) && d.getMonth() !== currentDate.getMonth() ? 'text-gray-300' : 'text-gray-700'} ${!isSameDay(d, selectedDate) && d.getMonth() === currentDate.getMonth() ? 'hover:bg-amber-100' : ''}`}
                    >
                        {d.getDate()}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Componente Principal do Fluxo
const SchedulingFlow = () => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date(2025, 6, 5));
    const [selectedTime, setSelectedTime] = useState(null);
    const [phone, setPhone] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', dob: '' });

    const nextStep = () => setStep((s) => s + 1);
    const prevStep = () => setStep((s) => s - 1);
    const handleServiceSelect = (service) => {
        setSelectedService(service);
    };
    const handleDateSelect = () => {
        if (selectedDate) nextStep();
    };
    const handleTimeSelect = () => {
        if (selectedTime) nextStep();
    };
    const handlePhoneSubmit = () => {
        phone === '11987654321' ? setStep((s) => s + 2) : setIsNewUser(true);
    };
    const handleNewUserSubmit = () => {
        if (userInfo.firstName && userInfo.lastName && userInfo.dob) nextStep();
    };
    const resetFlow = () => {
        setStep(1);
        setSelectedService(null);
        setSelectedDate(new Date(2025, 6, 5));
        setSelectedTime(null);
        setPhone('');
        setIsNewUser(false);
        setUserInfo({ firstName: '', lastName: '', dob: '' });
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Design de Lista com Check
                return (
                    <div>
                        <h2 className="mb-6 text-center text-xl font-bold text-gray-800">1. Escolha o Serviço</h2>
                        <div className="space-y-3">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${selectedService?.id === service.id ? 'border-amber-500 bg-amber-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <p className="font-semibold text-gray-800">{service.name}</p>
                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                            <Clock className="mr-2 h-4 w-4" /> {service.duration} min
                                            <span className="mx-2">|</span>
                                            R$ {service.price.toFixed(2).replace('.', ',')}
                                        </div>
                                    </div>
                                    {selectedService?.id === service.id && <CheckCircle className="h-6 w-6 text-amber-600" />}
                                </button>
                            ))}
                        </div>
                        <Button onClick={nextStep} className="mt-6 w-full py-3 text-base" disabled={!selectedService}>
                            Próximo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                );
            case 2: // Selecionar Data
                return (
                    <div>
                        <div className="mb-6 flex items-center">
                            <Button onClick={prevStep} variant="ghost" className="mr-2 p-2">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h2 className="text-xl font-bold text-gray-800">2. Escolha a Data</h2>
                        </div>
                        <Card className="mb-6">
                            <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
                        </Card>
                        <Button onClick={handleDateSelect} className="mt-6 w-full py-3 text-base" disabled={!selectedDate}>
                            Próximo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                );
            case 3: // Selecionar Hora
                return (
                    <div>
                        <div className="mb-6 flex items-center">
                            <Button onClick={prevStep} variant="ghost" className="mr-2 p-2">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h2 className="text-xl font-bold text-gray-800">3. Escolha o Horário</h2>
                        </div>
                        <h3 className="mb-4 text-lg font-semibold text-gray-800">Horários Disponíveis</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {availableTimes.map((time) => (
                                <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)}>
                                    {time}
                                </Button>
                            ))}
                        </div>
                        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-500">
                            Para garantir seu horário, será cobrado um sinal de R$ 30,00.
                        </div>
                        <Button onClick={handleTimeSelect} className="mt-6 w-full py-3 text-base" disabled={!selectedTime}>
                            Próximo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                );
            case 4: // Informações
                return (
                    <div>
                        <div className="mb-6 flex items-center">
                            <Button onClick={prevStep} variant="ghost" className="mr-2 p-2">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h2 className="text-xl font-bold text-gray-800">4. Suas Informações</h2>
                        </div>
                        {!isNewUser ? (
                            <div className="space-y-4">
                                <p className="text-gray-600">Digite seu telefone. Se já tiver conta, seus dados serão preenchidos.</p>
                                <Input type="tel" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                <Button onClick={handlePhoneSubmit} className="w-full py-3 text-base">
                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-4">
                                <h3 className="font-semibold text-gray-700">Complete seu cadastro.</h3>
                                <Input
                                    placeholder="Nome"
                                    value={userInfo.firstName}
                                    onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                                />
                                <Input
                                    placeholder="Sobrenome"
                                    value={userInfo.lastName}
                                    onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                                />
                                <Input
                                    type="date"
                                    placeholder="Data de Nascimento"
                                    value={userInfo.dob}
                                    onChange={(e) => setUserInfo({ ...userInfo, dob: e.target.value })}
                                />
                                <Button onClick={handleNewUserSubmit} className="w-full py-3 text-base">
                                    Salvar e Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                );
            case 5: // Pagamento
                return (
                    <div>
                        <div className="mb-6 flex items-center">
                            <Button onClick={() => setStep(4)} variant="ghost" className="mr-2 p-2">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h2 className="text-xl font-bold text-gray-800">5. Pagamento do Sinal</h2>
                        </div>
                        <Card className="bg-gray-50">
                            <CardContent className="text-center">
                                <p className="mb-4 text-gray-600">Pague o sinal de R$ 30,00 via PIX para confirmar.</p>
                                <div className="flex justify-center">
                                    <img src="https://placehold.co/200x200/e2e8f0/333333?text=QR+Code+PIX" alt="QR Code PIX" className="rounded-lg" />
                                </div>
                                <Button onClick={() => {}} variant="outline" className="mt-4 w-full">
                                    Copiar Código PIX
                                </Button>
                                <p className="mt-4 text-xs text-gray-500">A confirmação é automática após o pagamento.</p>
                            </CardContent>
                        </Card>
                        <Button onClick={nextStep} className="mt-6 w-full py-3 text-base">
                            Já fiz o pagamento!
                        </Button>
                    </div>
                );
            case 6: // Confirmação
                return (
                    <div className="animate-fade-in text-center">
                        <PartyPopper className="mx-auto mb-4 h-16 w-16 text-amber-500" />
                        <h2 className="mb-2 text-2xl font-bold text-gray-800">Agendamento Confirmado!</h2>
                        <p className="mb-6 text-gray-600">Seu horário foi reservado com sucesso.</p>
                        <Card className="border border-amber-200 bg-amber-50 text-left">
                            <CardContent>
                                <p className="font-semibold text-slate-800">{selectedService?.name}</p>
                                <p className="mt-1 text-sm text-slate-700">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {selectedTime}
                                </p>
                            </CardContent>
                        </Card>
                        <Button onClick={resetFlow} className="mt-8 w-full py-3 text-base">
                            Agendar Novo Serviço
                        </Button>
                    </div>
                );
            default:
                return <div>Etapa Desconhecida</div>;
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="mx-auto w-full max-w-md">
                <div className="relative">
                    <img
                        src="https://placehold.co/1200x400/334155/FDE68A?text=Banner"
                        alt="Banner da Clínica"
                        className="h-28 w-full rounded-t-xl object-cover"
                    />
                    <div className="absolute top-full left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-amber-300">
                            H
                        </div>
                    </div>
                </div>
                <Card className="rounded-t-none">
                    <CardContent className="pt-12 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">Horaly</h1>
                        <p className="text-gray-500">Agenda Inteligente!</p>
                    </CardContent>
                    <hr />
                    <CardContent>{renderStep()}</CardContent>
                </Card>
            </div>
        </div>
    );
};

export default function App() {
    return <SchedulingFlow />;
}
