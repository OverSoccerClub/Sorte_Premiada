'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Bug,
    Plus,
    Filter,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    MessageSquare,
    Search,
    User as UserIcon,
    Calendar,
    MoreVertical,
    Activity,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos
type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'VALIDATED' | 'CLOSED' | 'REOPENED';
type BugSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type BugPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

interface BugReport {
    id: string;
    title: string;
    description: string;
    status: BugStatus;
    severity: BugSeverity;
    priority: BugPriority;
    location?: string;
    stepsToReproduce?: string;
    environment?: string;
    reportedByUser: { id: string; name: string; username: string };
    assignedToUser?: { id: string; name: string; username: string };
    fixedByUser?: { id: string; name: string; username: string };
    validatedByUser?: { id: string; name: string; username: string };
    fixDescription?: string;
    createdAt: string;
    updatedAt: string;
    _count: { comments: number };
}

interface BugComment {
    id: string;
    comment: string;
    statusChange?: boolean;
    previousStatus?: BugStatus;
    newStatus?: BugStatus;
    user: { id: string; name: string; username: string };
    createdAt: string;
}

export default function BugsPage() {
    const { user, authLoading } = useAuth();
    const router = useRouter();
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    // Filtros
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    // Estatísticas
    const [statistics, setStatistics] = useState<any>(null);

    // Verificar acesso MASTER
    useEffect(() => {
        if (!authLoading && user?.role !== 'MASTER') {
            toast.error('Acesso negado. Apenas usuários MASTER.');
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    // Carregar bugs
    const loadBugs = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (severityFilter !== 'all') params.append('severity', severityFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setBugs(data);
            }
        } catch (error) {
            toast.error('Erro ao carregar bugs');
        } finally {
            setLoading(false);
        }
    };

    // Carregar estatísticas
    const loadStatistics = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs/statistics`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setStatistics(data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas');
        }
    };

    useEffect(() => {
        if (user?.role === 'MASTER') {
            loadBugs();
            loadStatistics();
        }
    }, [user, statusFilter, severityFilter, priorityFilter]);

    // Helpers para badges
    const getStatusBadge = (status: BugStatus) => {
        const variants: Record<BugStatus, { color: string; icon: any; label: string }> = {
            OPEN: { color: 'bg-red-500', icon: AlertCircle, label: 'Aberto' },
            IN_PROGRESS: { color: 'bg-blue-500', icon: Clock, label: 'Em Progresso' },
            FIXED: { color: 'bg-yellow-500', icon: CheckCircle2, label: 'Corrigido' },
            VALIDATED: { color: 'bg-green-500', icon: CheckCircle2, label: 'Validado' },
            CLOSED: { color: 'bg-zinc-500', icon: XCircle, label: 'Fechado' },
            REOPENED: { color: 'bg-orange-500', icon: AlertCircle, label: 'Reaberto' },
        };

        const config = variants[status];
        if (!config) return null;

        const { color, icon: Icon, label } = config;
        return (
            <Badge className={`${color} text-white flex gap-1 items-center w-fit`}>
                <Icon className="w-3 h-3" />
                {label}
            </Badge>
        );
    };

    const getSeverityBadge = (severity: BugSeverity) => {
        const variants: Record<BugSeverity, { color: string; label: string }> = {
            CRITICAL: { color: 'bg-red-700 text-white border-red-800', label: 'Crítica' },
            HIGH: { color: 'bg-orange-600 text-white border-orange-700', label: 'Alta' },
            MEDIUM: { color: 'bg-yellow-600 text-white border-yellow-700', label: 'Média' },
            LOW: { color: 'bg-blue-500 text-white border-blue-600', label: 'Baixa' },
        };

        const config = variants[severity];
        return <Badge className={`${config.color} border w-fit font-medium`}>{config.label}</Badge>;
    };

    const getPriorityBadge = (priority: BugPriority) => {
        const variants: Record<BugPriority, { color: string; label: string }> = {
            URGENT: { color: 'bg-purple-600 text-white', label: 'Urgente' },
            HIGH: { color: 'bg-orange-600 text-white', label: 'Alta' },
            MEDIUM: { color: 'bg-yellow-600 text-white', label: 'Média' },
            LOW: { color: 'bg-green-600 text-white', label: 'Baixa' },
        };

        const config = variants[priority];
        return <Badge variant="outline" className={`${config.color} border-none w-fit font-medium`}>{config.label}</Badge>;
    };

    if (authLoading || loading || user?.role !== 'MASTER') {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-foreground">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
                        <Bug className="w-8 h-8 text-emerald-600" />
                        Central de Bugs
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerenciamento e rastreamento de issues do sistema
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Reportar Novo Bug
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                        <CreateBugForm
                            onSuccess={() => {
                                setShowCreateDialog(false);
                                loadBugs();
                                loadStatistics();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Estatísticas */}
            {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard title="Total" value={statistics.total} icon={Activity} color="text-foreground" bg="bg-card" />
                    <StatCard title="Abertos" value={statistics.byStatus.open} icon={AlertCircle} color="text-red-600" bg="bg-red-500/10" />
                    <StatCard title="Em Progresso" value={statistics.byStatus.inProgress} icon={Clock} color="text-blue-600" bg="bg-blue-500/10" />
                    <StatCard title="Corrigidos" value={statistics.byStatus.fixed} icon={CheckCircle2} color="text-yellow-600" bg="bg-yellow-500/10" />
                    <StatCard title="Validados" value={statistics.byStatus.validated} icon={CheckCircle2} color="text-green-600" bg="bg-green-500/10" />
                    <StatCard title="Fechados" value={statistics.byStatus.closed} icon={XCircle} color="text-zinc-600" bg="bg-zinc-500/10" />
                </div>
            )}

            {/* Filtros */}
            <Card className="p-4 border-border shadow-sm bg-card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground md:w-32">
                        <Filter className="w-5 h-5" />
                        <span className="font-medium">Filtros</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full bg-background border-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="OPEN">Aberto</SelectItem>
                                    <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                                    <SelectItem value="FIXED">Corrigido</SelectItem>
                                    <SelectItem value="VALIDATED">Validado</SelectItem>
                                    <SelectItem value="CLOSED">Fechado</SelectItem>
                                    <SelectItem value="REOPENED">Reaberto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Severidade</Label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="w-full bg-background border-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Severidades</SelectItem>
                                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                                    <SelectItem value="HIGH">Alta</SelectItem>
                                    <SelectItem value="MEDIUM">Média</SelectItem>
                                    <SelectItem value="LOW">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade</Label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-full bg-background border-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                                    <SelectItem value="URGENT">Urgente</SelectItem>
                                    <SelectItem value="HIGH">Alta</SelectItem>
                                    <SelectItem value="MEDIUM">Média</SelectItem>
                                    <SelectItem value="LOW">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Lista de Bugs */}
            <div className="space-y-4">
                {bugs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-dashed border-border">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Bug className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Nenhum bug encontrado</h3>
                        <p className="text-muted-foreground mt-1">Ajuste os filtros ou crie um novo reporte.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {bugs.map((bug) => (
                            <Card
                                key={bug.id}
                                className="group p-5 hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-500 bg-card border-border"
                                onClick={() => {
                                    setSelectedBug(bug);
                                    setShowDetailDialog(true);
                                }}
                            >
                                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-sm font-mono text-muted-foreground">#{bug.id.split('-')[0]}</span>
                                            <h3 className="font-semibold text-lg text-foreground group-hover:text-emerald-600 transition-colors">
                                                {bug.title}
                                            </h3>
                                            {getStatusBadge(bug.status)}
                                        </div>

                                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                                            {bug.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-4">
                                            <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded">
                                                <UserIcon className="w-3.5 h-3.5" />
                                                <span>Reporter: <strong className="font-medium text-foreground">{bug.reportedByUser.name || bug.reportedByUser.username}</strong></span>
                                            </div>

                                            {bug.assignedToUser && (
                                                <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2 py-1 rounded border border-blue-500/20">
                                                    <UserIcon className="w-3.5 h-3.5" />
                                                    <span>Dev: <strong>{bug.assignedToUser.name || bug.assignedToUser.username}</strong></span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{format(new Date(bug.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}</span>
                                            </div>

                                            {bug.location && (
                                                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                                    <Search className="w-3.5 h-3.5" />
                                                    <span>{bug.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 min-w-[120px]">
                                        <div className="flex gap-2">
                                            {getSeverityBadge(bug.severity)}
                                            {getPriorityBadge(bug.priority)}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>{bug._count.comments} comentários</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialog de Detalhes */}
            {selectedBug && (
                <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-border">
                        <div className="p-6 border-b border-border sticky top-0 bg-card z-10 transition-colors">
                            <DialogHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-mono text-muted-foreground">#{selectedBug.id}</span>
                                    <div className="flex gap-2">
                                        {getStatusBadge(selectedBug.status)}
                                        {getSeverityBadge(selectedBug.severity)}
                                        {getPriorityBadge(selectedBug.priority)}
                                    </div>
                                </div>
                                <DialogTitle className="text-2xl text-foreground">{selectedBug.title}</DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="p-6 text-foreground">
                            <BugDetailView
                                bug={selectedBug}
                                onUpdate={() => {
                                    loadBugs();
                                    loadStatistics();
                                    // Atualiza o bug selecionado re-buscando ele
                                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs/${selectedBug.id}`, {
                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                    }).then(r => r.json()).then(setSelectedBug);
                                }}
                                onClose={() => setShowDetailDialog(false)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-4 flex flex-col justify-between border-border shadow-sm h-full bg-card">
            <div className="flex justify-between items-start mb-2">
                <span className="text-muted-foreground text-sm font-medium">{title}</span>
                <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
        </Card>
    )
}

function CreateBugForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            severity: formData.get('severity'),
            priority: formData.get('priority'),
            location: formData.get('location'),
            stepsToReproduce: formData.get('stepsToReproduce'),
            environment: formData.get('environment'),
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success('Bug reportado com sucesso!');
                onSuccess();
            } else {
                toast.error('Erro ao reportar bug');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <DialogHeader>
                <DialogTitle className="text-foreground">Reportar Novo Bug</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Forneça o máximo de detalhes possível para ajudar na identificação e correção.
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="title" className="text-foreground">Título do Erro *</Label>
                        <Input id="title" name="title" required placeholder="Ex: Erro ao salvar jogo na tela X" className="bg-background border-input text-foreground" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="severity" className="text-foreground">Severidade *</Label>
                        <Select name="severity" required defaultValue="MEDIUM">
                            <SelectTrigger className="bg-background border-input text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CRITICAL">Crítica (Sistema Parado)</SelectItem>
                                <SelectItem value="HIGH">Alta (Funcionalidade Quebrada)</SelectItem>
                                <SelectItem value="MEDIUM">Média (Falha Parcial)</SelectItem>
                                <SelectItem value="LOW">Baixa (Visual/Cosmético)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-foreground">Prioridade *</Label>
                        <Select name="priority" required defaultValue="MEDIUM">
                            <SelectTrigger className="bg-background border-input text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="URGENT">Urgente (Imediato)</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="MEDIUM">Média</SelectItem>
                                <SelectItem value="LOW">Baixa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="description" className="text-foreground">Descrição Detalhada *</Label>
                        <Textarea
                            id="description"
                            name="description"
                            required
                            className="min-h-[100px] bg-background border-input text-foreground"
                            placeholder="Descreva o que aconteceu, o que era esperado, etc."
                        />
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="stepsToReproduce" className="text-foreground">Passos para Reproduzir</Label>
                        <Textarea
                            id="stepsToReproduce"
                            name="stepsToReproduce"
                            className="min-h-[80px] bg-background border-input text-foreground"
                            placeholder="1. Acesse a tela X&#10;2. Clique no botão Y&#10;3. Observe o erro Z"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-foreground">Local / URL</Label>
                        <Input id="location" name="location" placeholder="Ex: /dashboard/games" className="bg-background border-input text-foreground" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="environment" className="text-foreground">Ambiente / Navegador</Label>
                        <Input id="environment" name="environment" placeholder="Ex: Chrome Windows, App Mobile Android" className="bg-background border-input text-foreground" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                        {loading ? 'Salvando...' : 'Registrar Bug'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function BugDetailView({ bug, onUpdate, onClose }: any) {
    const [comment, setComment] = useState('');
    const [newStatus, setNewStatus] = useState<BugStatus | ''>('');
    const [loading, setLoading] = useState(false);
    const [fixDescription, setFixDescription] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { user } = useAuth();

    // Lista de comentários e histórico ordenados
    const comments = bug.comments || [];

    // Determina se deve mostrar campo de descrição da correção
    const shouldShowFixDescription = newStatus === 'FIXED';

    const handleUpdate = async () => {
        if (!comment && !newStatus) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Se tiver mudança de status, atualiza o bug principal
            if (newStatus && newStatus !== bug.status) {
                const updateBody: any = { status: newStatus };

                // Se for developer assumindo o bug
                if (newStatus === 'IN_PROGRESS' && !bug.assignedToUserId) {
                    updateBody.assignedToUserId = user?.id; // Auto-assign
                }

                if (fixDescription) {
                    updateBody.fixDescription = fixDescription;
                }

                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs/${bug.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updateBody),
                });
            }

            // 2. Adiciona o comentário/log
            const commentBody: any = {
                comment: comment || (newStatus ? `Status alterado para ${newStatus}` : 'Comentário adicionado'),
            };

            if (newStatus && newStatus !== bug.status) {
                commentBody.statusChange = true;
                commentBody.previousStatus = bug.status;
                commentBody.newStatus = newStatus;
            }

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs/${bug.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(commentBody),
            });

            toast.success('Atualizado com sucesso!');
            setComment('');
            setNewStatus('');
            setFixDescription('');
            onUpdate();
        } catch (error) {
            toast.error('Erro ao atualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        setShowDeleteDialog(false);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs/${bug.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success('Bug excluído com sucesso!');
                onClose();
                onUpdate();
            } else {
                toast.error('Erro ao excluir bug');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Coluna Esquerda: Detalhes */}
            <div className="lg:col-span-3 space-y-8">

                <div className="space-y-4">
                    <div>
                        <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Descrição</Label>
                        <div className="mt-1 text-foreground whitespace-pre-wrap leading-relaxed">{bug.description}</div>
                    </div>

                    {bug.stepsToReproduce && (
                        <div className="bg-muted p-4 rounded-lg border border-border">
                            <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2 block">Passos para Reproduzir</Label>
                            <div className="text-foreground whitespace-pre-wrap font-mono text-sm">{bug.stepsToReproduce}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {bug.location && (
                            <div>
                                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Local / URL</Label>
                                <div className="mt-1 text-sm font-medium text-foreground">{bug.location}</div>
                            </div>
                        )}
                        {bug.environment && (
                            <div>
                                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Ambiente</Label>
                                <div className="mt-1 text-sm font-medium text-foreground">{bug.environment}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-border pt-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        Histórico e Comentários
                    </h3>

                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                        {comments.map((c: BugComment) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold shrink-0 ring-1 ring-emerald-500/20">
                                    {c.user.name?.substring(0, 2) || 'US'}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm text-foreground">{c.user.name || c.user.username}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                    </div>
                                    <div className="bg-muted p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-sm text-foreground">
                                        {c.comment}
                                        {c.statusChange && (
                                            <div className="mt-2 text-xs flex items-center gap-2 text-muted-foreground bg-background p-1 rounded border border-border w-fit">
                                                <Activity className="w-3 h-3" />
                                                Mudou status de <span className="font-bold text-foreground">{c.previousStatus}</span> para <span className="font-bold text-foreground">{c.newStatus}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {comments.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum comentário ainda.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Coluna Direita: Ações e Metadados */}
            <div className="space-y-5">
                <Card className="p-5 bg-gradient-to-br from-muted/50 to-muted border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Activity className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide">Informações do Bug</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Reportado em</span>
                            </div>
                            <span className="font-semibold text-foreground">{format(new Date(bug.createdAt), "dd/MMM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Reportado por</span>
                            </div>
                            <span className="font-semibold text-foreground">{bug.reportedByUser.name || bug.reportedByUser.username}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Atribuído a</span>
                            </div>
                            <span className="font-semibold text-foreground">{bug.assignedToUser ? (bug.assignedToUser.name || bug.assignedToUser.username) : '-'}</span>
                        </div>
                        {bug.fixedByUser && (
                            <div className="flex items-center justify-between py-2.5">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Corrigido por</span>
                                </div>
                                <span className="font-semibold text-foreground">{bug.fixedByUser.name || bug.fixedByUser.username}</span>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-5 border-border shadow-sm bg-card">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-foreground">Atualizar Status</h4>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs mb-2 block text-muted-foreground font-medium">Alterar Status para:</Label>
                            <Select onValueChange={(v) => setNewStatus(v as BugStatus)}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="Manter atual" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">🔴 Aberto</SelectItem>
                                    <SelectItem value="IN_PROGRESS">🔵 Em Progresso (Assumir)</SelectItem>
                                    <SelectItem value="FIXED">🟡 Corrigido</SelectItem>
                                    <SelectItem value="VALIDATED">🟢 Validado</SelectItem>
                                    <SelectItem value="CLOSED">⚫ Fechado</SelectItem>
                                    <SelectItem value="REOPENED">🟠 Reabrir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {shouldShowFixDescription && (
                            <div>
                                <Label className="text-xs mb-2 block text-muted-foreground font-medium">Descrição da Correção (Opcional)</Label>
                                <Textarea
                                    placeholder="Descreva tecnicamente o que foi corrigido..."
                                    className="h-20 text-sm bg-background border-input text-foreground resize-none"
                                    value={fixDescription}
                                    onChange={(e) => setFixDescription(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <Label className="text-xs mb-2 block text-muted-foreground font-medium">Comentário</Label>
                            <Textarea
                                placeholder="Adicione um comentário sobre esta atualização..."
                                className="h-24 bg-background border-input text-foreground resize-none"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                            onClick={handleUpdate}
                            disabled={loading || (!comment && !newStatus)}
                        >
                            {loading ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Atualizar Bug
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                <Card className="p-5 border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-red-600 flex items-center gap-2">
                            Zona de Perigo
                        </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        Esta ação é <strong className="text-red-600">irreversível</strong> e removerá permanentemente todos os dados deste bug, incluindo comentários e histórico.
                    </p>
                    <Button
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? (
                            <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Bug Permanentemente
                            </>
                        )}
                    </Button>

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogContent className="bg-card border-red-500/30">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="w-5 h-5" />
                                    Confirmar Exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-foreground space-y-2">
                                    <p className="font-medium">
                                        Tem certeza que deseja excluir o bug <span className="text-red-600">#{bug.id.split('-')[0]}</span>?
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Esta ação é irreversível e removerá o histórico e configurações deste bug.
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-background hover:bg-muted">
                                    Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Excluir Bug
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </Card>
            </div>
        </div>
    );
}
