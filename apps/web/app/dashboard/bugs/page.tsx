'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/alert-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
    MessageSquare,
    Search,
    User as UserIcon,
    Calendar,
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
    comments?: BugComment[];
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
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { showAlert } = useAlert();
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    // Filtros
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    // Verificar acesso MASTER
    useEffect(() => {
        if (!authLoading && user?.role !== 'MASTER') {
            showAlert('Acesso Negado', 'Apenas usuários MASTER.', 'error');
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
            showAlert('Erro', 'Erro ao carregar bugs', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'MASTER') {
            loadBugs();
        }
    }, [user, statusFilter, severityFilter, priorityFilter]);

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Rastreador de Bugs</h1>
                    <p className="text-muted-foreground">Gerencie e acompanhe reportes de erros do sistema</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Reporte
                </Button>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Reportar Novo Bug</DialogTitle>
                        <DialogDescription>
                            Forneça o máximo de detalhes possível para ajudar na identificação e correção.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateBugForm
                        onSuccess={() => {
                            setShowCreateDialog(false);
                            loadBugs();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <span className="text-muted-foreground">#{selectedBug?.id?.split('-')[0]}</span>
                            <span>{selectedBug?.title}</span>
                            {selectedBug && <StatusBadge status={selectedBug.status} />}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedBug && (
                        <BugDetailView
                            bug={selectedBug}
                            onUpdate={loadBugs}
                            onClose={() => setShowDetailDialog(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtros:</span>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="OPEN">Aberto</SelectItem>
                        <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                        <SelectItem value="FIXED">Corrigido</SelectItem>
                        <SelectItem value="VALIDATED">Validado</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Severidade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Severidades</SelectItem>
                        <SelectItem value="CRITICAL">Crítica</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="MEDIUM">Média</SelectItem>
                        <SelectItem value="LOW">Baixa</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    onClick={() => {
                        setStatusFilter('all');
                        setSeverityFilter('all');
                        setPriorityFilter('all');
                    }}
                    className="ml-auto"
                >
                    Limpar Filtros
                </Button>
            </div>

            {/* Lista de Bugs */}
            <div className="grid gap-4">
                {bugs.map((bug) => (
                    <Card
                        key={bug.id}
                        className="p-4 hover:border-emerald-500/50 transition-all cursor-pointer group"
                        onClick={() => {
                            setSelectedBug(bug);
                            setShowDetailDialog(true);
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">#{bug.id.split('-')[0]}</span>
                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-emerald-500 transition-colors">
                                        {bug.title}
                                    </h3>
                                    <StatusBadge status={bug.status} />
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center">
                                    <div className="flex items-center gap-1">
                                        <UserIcon className="w-3.5 h-3.5" />
                                        <span>{bug.reportedByUser.name || bug.reportedByUser.username}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{format(new Date(bug.createdAt), "dd/MMM/yyyy HH:mm", { locale: ptBR })}</span>
                                    </div>
                                    <span>•</span>
                                    <Badge variant="outline" className={getSeverityColor(bug.severity)}>
                                        {getSeverityLabel(bug.severity)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-2">
                                <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                                    {bug._count?.comments || 0} comentários
                                </Badge>
                                {bug.assignedToUser && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>Atribuído a</span>
                                        <strong className="text-foreground">{bug.assignedToUser.name}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {bugs.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Bug className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Nenhum bug encontrado</h3>
                        <p>Tudo parece estar funcionando perfeitamente!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Subcomponentes auxiliares

function StatusBadge({ status }: { status: BugStatus }) {
    const styles = {
        OPEN: "bg-red-500/10 text-red-600 border-red-500/20",
        IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        FIXED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        VALIDATED: "bg-green-500/10 text-green-600 border-green-500/20",
        CLOSED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        REOPENED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };

    const labels = {
        OPEN: "Aberto",
        IN_PROGRESS: "Em Progresso",
        FIXED: "Corrigido",
        VALIDATED: "Validado",
        CLOSED: "Fechado",
        REOPENED: "Reaberto",
    };

    return (
        <Badge variant="outline" className={styles[status] || styles.OPEN}>
            {labels[status] || status}
        </Badge>
    );
}

function getSeverityColor(severity: BugSeverity) {
    switch (severity) {
        case 'CRITICAL': return "text-red-600 border-red-500/30 bg-red-500/5";
        case 'HIGH': return "text-orange-600 border-orange-500/30 bg-orange-500/5";
        case 'MEDIUM': return "text-yellow-600 border-yellow-500/30 bg-yellow-500/5";
        case 'LOW': return "text-blue-600 border-blue-500/30 bg-blue-500/5";
        default: return "";
    }
}

function getSeverityLabel(severity: BugSeverity) {
    switch (severity) {
        case 'CRITICAL': return "Crítica";
        case 'HIGH': return "Alta";
        case 'MEDIUM': return "Média";
        case 'LOW': return "Baixa";
        default: return severity;
    }
}

function CreateBugForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [severity, setSeverity] = useState<BugSeverity>('MEDIUM');
    const [priority, setPriority] = useState<BugPriority>('MEDIUM');
    const [environment, setEnvironment] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bugs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    stepsToReproduce: steps,
                    severity,
                    priority,
                    environment,
                    location
                })
            });

            if (response.ok) {
                showAlert('Sucesso', 'Bug reportado com sucesso!', 'success');
                onSuccess();
            } else {
                showAlert('Erro', 'Erro ao reportar bug', 'error');
            }
        } catch (error) {
            showAlert('Erro', 'Erro de conexão', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label>Título / Resumo</Label>
                    <Input
                        placeholder="Ex: Erro ao gerar bilhete no Firefox"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Severidade</Label>
                    <Select value={severity} onValueChange={(v: BugSeverity) => setSeverity(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LOW">Baixa</SelectItem>
                            <SelectItem value="MEDIUM">Média</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                            <SelectItem value="CRITICAL">Crítica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={priority} onValueChange={(v: BugPriority) => setPriority(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LOW">Baixa</SelectItem>
                            <SelectItem value="MEDIUM">Média</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Descrição Detalhada</Label>
                <Textarea
                    placeholder="Descreva o problema detalhadamente..."
                    className="h-24"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Passos para Reproduzir</Label>
                <Textarea
                    placeholder="1. Acesse tal página&#10;2. Clique em..."
                    className="h-24 font-mono text-sm"
                    value={steps}
                    onChange={e => setSteps(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Local / URL</Label>
                    <Input
                        placeholder="/dashboard/..."
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Input
                        placeholder="Ex: Produção, Windows, Chrome"
                        value={environment}
                        onChange={e => setEnvironment(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Bug className="w-4 h-4 mr-2" />}
                    Reportar Bug
                </Button>
            </div>
        </form>
    );
}

function BugDetailView({ bug, onUpdate, onClose }: { bug: BugReport, onUpdate: () => void, onClose: () => void }) {
    const [comment, setComment] = useState('');
    const [newStatus, setNewStatus] = useState<BugStatus | ''>('');
    const [loading, setLoading] = useState(false);
    const [fixDescription, setFixDescription] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { user } = useAuth();
    const { showAlert } = useAlert();

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
                if (newStatus === 'IN_PROGRESS' && !bug.assignedToUser) {
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

            showAlert('Sucesso', 'Atualizado com sucesso!', 'success');
            setComment('');
            setNewStatus('');
            setFixDescription('');
            onUpdate();
        } catch (error) {
            showAlert('Erro', 'Erro ao atualizar', 'error');
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
                showAlert('Sucesso', 'Bug excluído com sucesso!', 'success');
                onClose();
                onUpdate();
            } else {
                showAlert('Erro', 'Erro ao excluir bug', 'error');
            }
        } catch (error) {
            showAlert('Erro', 'Erro de conexão', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Seção de Descrição */}
                <Card className="p-6 border-border shadow-sm bg-card">
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">
                                Descrição Detalhada
                            </Label>
                            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                                {bug.description}
                            </div>
                        </div>

                        {bug.stepsToReproduce && (
                            <div>
                                <Label className="text-xs mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">
                                    Passos para Reproduzir
                                </Label>
                                <div className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground">
                                    {bug.stepsToReproduce}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bug.location && (
                                <div>
                                    <Label className="text-xs mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">
                                        Local / URL
                                    </Label>
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground">
                                        <div className="p-1.5 rounded-md bg-background border border-border">
                                            <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <span className="truncate">{bug.location}</span>
                                    </div>
                                </div>
                            )}

                            {bug.environment && (
                                <div>
                                    <Label className="text-xs mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">
                                        Ambiente
                                    </Label>
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground">
                                        <div className="p-1.5 rounded-md bg-background border border-border">
                                            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <span className="truncate">{bug.environment}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Histórico de Comentários */}
                <Card className="p-6 border-border shadow-sm bg-card">
                    <div className="flex items-center gap-2 mb-6">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-lg text-foreground">Histórico de Atividades</h3>
                        <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground">
                            {comments.length} registros
                        </Badge>
                    </div>

                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-[2px] before:bg-border/50 before:z-0">
                        {comments.map((comment: BugComment) => (
                            <div key={comment.id} className="relative z-10 pl-10 group">
                                <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-background border-2 border-muted-foreground/30 group-hover:border-emerald-500 transition-colors" />
                                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 group-hover:border-border transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {comment.user.name || comment.user.username}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                        {comment.statusChange && (
                                            <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                                Status Alterado
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {comment.comment}
                                    </p>
                                    {comment.statusChange && comment.previousStatus && comment.newStatus && (
                                        <div className="mt-3 flex items-center gap-2 text-xs bg-background/50 p-2 rounded-lg border border-border/50 w-fit">
                                            <span className="text-muted-foreground line-through opacity-70">{comment.previousStatus}</span>
                                            <div className="text-muted-foreground">→</div>
                                            <span className="font-medium text-emerald-600">{comment.newStatus}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {comments.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Nenhum comentário ainda</p>
                                <p className="text-xs mt-1">Seja o primeiro a comentar sobre este bug</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Coluna Direita: Metadados e Ações (1/3) */}
            <div className="space-y-5">
                {/* Informações do Bug */}
                <Card className="p-5 bg-gradient-to-br from-muted/50 to-muted/30 border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <Activity className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">Informações</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start justify-between py-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs">Reportado em</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs">
                                {format(new Date(bug.createdAt), "dd/MMM/yyyy", { locale: ptBR })}
                            </span>
                        </div>
                        <div className="flex items-start justify-between py-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs">Reportado por</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs max-w-[120px] truncate" title={bug.reportedByUser.name || bug.reportedByUser.username}>
                                {bug.reportedByUser.name || bug.reportedByUser.username}
                            </span>
                        </div>
                        <div className="flex items-start justify-between py-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs">Atribuído a</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs max-w-[120px] truncate" title={bug.assignedToUser ? (bug.assignedToUser.name || bug.assignedToUser.username) : 'Não atribuído'}>
                                {bug.assignedToUser ? (bug.assignedToUser.name || bug.assignedToUser.username) : (
                                    <span className="text-muted-foreground italic">Não atribuído</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-start justify-between py-2.5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs">Última atualização</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs">
                                {format(new Date(bug.updatedAt), "dd/MMM/yyyy", { locale: ptBR })}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Atualizar Status */}
                <Card className="p-5 border-border shadow-sm bg-card">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Atualizar Status</h4>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs mb-2 block text-muted-foreground font-semibold uppercase tracking-wider">
                                Novo Status
                            </Label>
                            <Select onValueChange={(v) => setNewStatus(v as BugStatus)} value={newStatus}>
                                <SelectTrigger className="bg-background border-input text-foreground hover:border-emerald-500/50 transition-colors">
                                    <SelectValue placeholder="Selecione um status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">🔴 Aberto</SelectItem>
                                    <SelectItem value="IN_PROGRESS">🔵 Em Progresso</SelectItem>
                                    <SelectItem value="FIXED">🟡 Corrigido</SelectItem>
                                    <SelectItem value="VALIDATED">🟢 Validado</SelectItem>
                                    <SelectItem value="CLOSED">⚫ Fechado</SelectItem>
                                    <SelectItem value="REOPENED">🟠 Reabrir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {shouldShowFixDescription && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-xs mb-2 block text-muted-foreground font-semibold uppercase tracking-wider">
                                    Descrição da Correção
                                </Label>
                                <Textarea
                                    placeholder="Descreva tecnicamente o que foi corrigido..."
                                    className="h-24 text-sm bg-background border-input text-foreground resize-none focus:border-emerald-500/50 transition-colors"
                                    value={fixDescription}
                                    onChange={(e) => setFixDescription(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <Label className="text-xs mb-2 block text-muted-foreground font-semibold uppercase tracking-wider">
                                Comentário
                            </Label>
                            <Textarea
                                placeholder="Adicione um comentário sobre esta atualização..."
                                className="h-28 bg-background border-input text-foreground resize-none focus:border-emerald-500/50 transition-colors"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
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

                {/* Zona de Perigo */}
                <Card className="p-5 border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-red-500/10 ring-1 ring-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <h4 className="font-bold text-sm text-red-600 uppercase tracking-wide">
                            Zona de Perigo
                        </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        Esta ação é <strong className="text-red-600">irreversível</strong> e removerá permanentemente todos os dados deste bug.
                    </p>
                    <Button
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
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
                                Excluir Permanentemente
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
                                        Tem certeza que deseja excluir o bug <span className="text-red-600 font-bold">#{bug.id.split('-')[0]}</span>?
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
