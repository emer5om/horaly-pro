// resources/js/Layouts/AdminLayout.tsx

import AdminNav from '@/components/Admin/AdminNav';
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
import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, LogOut, Menu, Settings } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

// Definindo a tipagem para as props que o Layout vai receber.
// Usamos PropsWithChildren para incluir a prop 'children' automaticamente.
// E pegamos o 'auth' do PageProps global, que já vem definido no starter kit.
type AdminLayoutProps = PropsWithChildren<{
    auth?: PageProps['auth'];
}>;

export default function AdminLayout({ auth, children }: AdminLayoutProps) {
    // Se auth não for passado como prop, pega do usePage
    const page = usePage<PageProps>();
    const authData = auth || page.props.auth;
    const { url } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
                        <AdminNav onNavigate={() => setSidebarOpen(false)} />
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
                    <AdminNav />
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64">
                {/* Top header */}
                <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:px-6 border-b">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu button */}
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                        
                        <h1 className="text-lg font-semibold text-gray-900 md:text-xl">Painel Administrativo</h1>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                0
                            </span>
                        </Button>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/avatars/admin.png" alt="Admin" />
                                        <AvatarFallback>{authData?.user?.name?.charAt(0) || 'A'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm leading-none font-medium">{authData?.user?.name || 'Administrador'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {authData?.user?.email || 'admin@horaly.com'}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/settings" className="cursor-pointer">
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
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
