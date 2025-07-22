import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    establishment?: Establishment;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Establishment {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    slug?: string;
    description?: string;
    slogan?: string;
    booking_fee_enabled?: boolean;
    booking_fee_type?: 'fixed' | 'percentage';
    booking_fee_amount?: number;
    booking_fee_percentage?: number;
    mercadopago_access_token?: string;
    accepted_payment_methods?: string[];
    booking_fee_status?: string;
    payment_enabled?: boolean;
    payment_methods?: string[];
    created_at: string;
    updated_at: string;
    plan?: Plan;
    [key: string]: unknown;
}

export interface Plan {
    id: number;
    name: string;
    features?: string[];
    commission_percentage?: number;
    [key: string]: unknown;
}

export interface PageProps {
    auth: Auth;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}
