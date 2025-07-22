import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BarChart3, Building, Calendar, CalendarClock, Home, Link as LinkIcon, Scissors, User, Users, CreditCard, TrendingUp, Bell, Crown } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: (NavItem & { feature?: string })[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Agenda',
        href: '/agenda',
        icon: CalendarClock,
        feature: 'appointments',
    },
    {
        title: 'Agendamentos',
        href: '/appointments',
        icon: Calendar,
        feature: 'appointments',
    },
    {
        title: 'Clientes',
        href: '/customers',
        icon: Users,
        feature: 'customers',
    },
    {
        title: 'Serviços',
        href: '/services',
        icon: Scissors,
        feature: 'services',
    },
    {
        title: 'Link de Agendamento',
        href: '/settings/booking-link',
        icon: LinkIcon,
        feature: 'appointments',
    },
    {
        title: 'Minha Conta',
        href: '/settings/account',
        icon: User,
    },
    {
        title: 'Minha Empresa',
        href: '/company',
        icon: Building,
    },
    {
        title: 'Pagamentos',
        href: '/payments',
        icon: CreditCard,
    },
    {
        title: 'Meu Plano',
        href: '/subscription',
        icon: Crown,
    },
    {
        title: 'Marketing & Analytics',
        href: '/integrations',
        icon: TrendingUp,
        feature: 'analytics',
    },
    {
        title: 'Notificações',
        href: '/notifications',
        icon: Bell,
        feature: 'notifications',
    },
];

const footerNavItems: NavItem[] = [];

interface EstablishmentSidebarProps {
    planFeatures?: string[];
}

export function EstablishmentSidebar({ planFeatures = [] }: EstablishmentSidebarProps) {
    // Filter navigation items based on plan features
    const filteredNavItems = mainNavItems.filter(item => {
        if (!item.feature) return true; // Always show items without feature requirement
        return planFeatures.includes(item.feature);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
