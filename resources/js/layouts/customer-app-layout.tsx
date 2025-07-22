import { CustomerSidebar } from '@/components/customer-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Head } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface CustomerAppLayoutProps {
    title: string;
}

export default function CustomerAppLayout({ title, children }: PropsWithChildren<CustomerAppLayoutProps>) {
    return (
        <SidebarProvider>
            <Head title={title} />
            
            <CustomerSidebar />
            
            <SidebarInset>
                <main className="flex flex-1 flex-col">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}