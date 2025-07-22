import AdminLayout from '@/layouts/Admin/AdminLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';

export default function Index({ auth }: PageProps) {
    return (
        <AdminLayout auth={auth}>
            <Head title="Tickets de Suporte" />
            <div className="p-6 text-gray-900 dark:text-gray-100">Aqui ficará a lista de tickets de suporte dos estabelecimentos.</div>
        </AdminLayout>
    );
}
