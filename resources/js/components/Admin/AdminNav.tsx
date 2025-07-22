// resources/js/Components/Admin/AdminNav.tsx

import { Link, usePage } from '@inertiajs/react';
import { Building, CreditCard, LayoutDashboard, Palette, Ticket, Receipt } from 'lucide-react';
import React from 'react';

interface AdminNavProps {
    onNavigate?: () => void;
}

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Estabelecimentos', href: '/admin/establishments', icon: Building },
    { name: 'Planos', href: '/admin/plans', icon: CreditCard },
    { name: 'Transações', href: '/admin/transactions', icon: Receipt },
    { name: 'Landing Page', href: '/admin/landing-page', icon: Palette },
    { name: 'Suporte', href: '/admin/support', icon: Ticket },
];

export default function AdminNav({ onNavigate }: AdminNavProps) {
    const { url } = usePage();

    return (
        <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
                const isActive = url === item.href || url.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={onNavigate}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
}
