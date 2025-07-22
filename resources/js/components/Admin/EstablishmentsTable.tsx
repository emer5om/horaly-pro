import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';

// 1. DEFINIÇÃO DO TIPO (TYPE DEFINITION)
// Definimos a "forma" que um objeto de estabelecimento deve ter.
// Isso garante que todos os dados passados para este componente sigam essa estrutura.
export type Establishment = {
    id: number;
    name: string;
    owner_name: string;
    plan: 'Básico' | 'Profissional' | 'Premium'; // Usamos um Union Type para planos definidos
    status: 'Ativo' | 'Inativo' | 'Bloqueado'; // E também para o status
    created_at: string; // Manteremos como string para simplicidade por enquanto
};

// 2. DEFINIÇÃO DAS PROPS DO COMPONENTE
// O componente espera receber uma prop chamada 'establishments',
// que deve ser um array de objetos do tipo 'Establishment'.
type EstablishmentsTableProps = {
    establishments: Establishment[];
};

export default function EstablishmentsTable({ establishments }: EstablishmentsTableProps) {
    // Função auxiliar para determinar a cor do Badge com base no status.
    // Isso mantém a lógica de UI separada do JSX principal.
    const getStatusVariant = (status: Establishment['status']) => {
        switch (status) {
            case 'Ativo':
                return 'success'; // Shadcn não tem 'success' por padrão, mas podemos adicionar. Por enquanto, usará o default.
            case 'Inativo':
                return 'secondary';
            case 'Bloqueado':
                return 'destructive';
            default:
                return 'default';
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                {/* 3. CABEÇALHO DA TABELA */}
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome do Estabelecimento</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead>
                            {/* A coluna de ações não precisa de título */}
                            <span className="sr-only">Ações</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                {/* 4. CORPO DA TABELA */}
                <TableBody>
                    {/* Verificamos se há estabelecimentos. Se não, mostramos uma mensagem. */}
                    {establishments.length > 0 ? (
                        // Usamos .map() para iterar sobre os dados e criar uma linha para cada um.
                        establishments.map((establishment) => (
                            <TableRow key={establishment.id}>
                                <TableCell className="font-medium">{establishment.name}</TableCell>
                                <TableCell>{establishment.owner_name}</TableCell>
                                <TableCell>
                                    {/* O Badge mostra o status de forma visual */}
                                    <Badge variant={getStatusVariant(establishment.status)}>{establishment.status}</Badge>
                                </TableCell>
                                <TableCell>{establishment.plan}</TableCell>
                                <TableCell>{establishment.created_at}</TableCell>
                                <TableCell>
                                    {/* 5. MENU DE AÇÕES (DROPDOWN) */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Bloquear</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        // Mensagem exibida quando não há dados
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Nenhum estabelecimento encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
