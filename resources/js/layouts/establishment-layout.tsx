import { Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Bell, Calendar, Crown, Home, LogOut, Menu, Scissors, Settings, Users } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface EstablishmentLayoutProps {
    children: React.ReactNode;
    title?: string;
    establishment?: {
        id: number;
        name: string;
        email: string;
        phone: string;
        status: string;
        plan?: {
            name: string;
            price: number;
            features?: string[];
        };
    };
    planFeatures?: string[];
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, feature: null },
    { name: 'Agendamentos', href: '/appointments', icon: Calendar, feature: 'appointments' },
    { name: 'Serviços', href: '/services', icon: Scissors, feature: 'services' },
    { name: 'Clientes', href: '/customers', icon: Users, feature: 'customers' },
    { name: 'Relatórios', href: '/reports', icon: BarChart3, feature: 'reports' },
    { name: 'Meu Plano', href: '/subscription', icon: Crown, feature: null },
    { name: 'Configurações', href: '/settings', icon: Settings, feature: null },
];

export default function EstablishmentLayout({ children, title = 'Dashboard', establishment, planFeatures = [] }: EstablishmentLayoutProps) {
    const { url } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Filter navigation based on plan features
    const filteredNavigation = navigation.filter(item => {
        if (!item.feature) return true; // Always show items without feature requirement
        return planFeatures.includes(item.feature);
    });

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <div className="flex h-full flex-col">
                        <div className="flex h-16 items-center justify-between border-b px-6">
                            <div className="flex items-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                    <span className="text-sm font-bold text-white">H</span>
                                </div>
                                <span className="text-xl font-semibold">Horaly</span>
                            </div>
                        </div>
                        <nav className="flex-1 space-y-1 px-4 py-4">
                            {filteredNavigation.map((item) => {
                                const isActive = url === item.href || url.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop sidebar */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                    <div className="flex h-16 items-center justify-between border-b px-6">
                        <div className="flex items-center space-x-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                <span className="text-sm font-bold text-white">H</span>
                            </div>
                            <span className="text-xl font-semibold">Horaly</span>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-1 px-4 py-4">
                        {filteredNavigation.map((item) => {
                            const isActive = url === item.href || url.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64">
                {/* Top header */}
                <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:px-6">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">{title}</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Notifications - only show if plan includes notifications */}
                        {planFeatures.includes('notifications') && (
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    2
                                </span>
                            </Button>
                        )}

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/avatars/01.png" alt="Avatar" />
                                        <AvatarFallback>{establishment?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm leading-none font-medium">{establishment?.name || 'Estabelecimento'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {establishment?.email || 'email@estabelecimento.com'}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configurações
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
