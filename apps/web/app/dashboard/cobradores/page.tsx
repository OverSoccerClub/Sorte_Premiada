"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { AppConfig } from "../../AppConfig"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Save, X, Eye, EyeOff, Users, Search, Filter, Loader2, Lock, Wallet, SquarePen, Mail } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAlert } from "@/context/alert-context"
import { Badge } from "@/components/ui/badge"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"

interface Cobrador {
    id: string
    name: string
    username: string
    email: string
    role: string
    securityPin?: string
    areaId?: string
    area?: {
        name: string
        city: string
    }
}

interface Area {
    id: string
    name: string
    city: string
    state: string
}

export default function CobradoresPage() {
    const { token } = useAuth()
    const router = useRouter()
    const { showAlert, hideAlert } = useAlert()

    const [cobradores, setCobradores] = useState<Cobrador[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Cobrador | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)

    // Form states
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [areaId, setAreaId] = useState("")
    const [areas, setAreas] = useState<Area[]>([])
    const [showPin, setShowPin] = useState(false)

    useEffect(() => {
        fetchCobradores()
        fetchAreas()
    }, [token])

    const fetchAreas = async () => {
        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/areas`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAreas(data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchCobradores = async () => {
        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                // Filter only COBRADOR type
                const filtered = data.filter((u: any) => u.role === 'COBRADOR')
                setCobradores(filtered)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !username || !pin || pin.length !== 4) {
            showAlert("Preencha os campos obrigatórios. PIN deve ter 4 dígitos.", "error")
            return
        }

        const payload: any = {
            name,
            username,
            email: email || undefined,
            role: 'COBRADOR',
            securityPin: pin,
            areaId: areaId || undefined
        }

        if (password) payload.password = password
        // If editing and no password update, backend handles it? 
        // We need separate create/update logic usually, or backend ignores empty password on update.

        const url = editingUser
            ? `${AppConfig.api.baseUrl}/users/${editingUser.id}`
            : `${AppConfig.api.baseUrl}/users`

        const method = editingUser ? 'PATCH' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err)
            }

            showAlert(editingUser ? "Cobrador atualizado!" : "Cobrador criado!", "success")
            setIsDialogOpen(false)
            fetchCobradores()
            resetForm()
        } catch (e: any) {
            showAlert(e.message || "Erro ao salvar", "error")
        }
    }

    const resetForm = () => {
        setEditingUser(null)
        setName("")
        setUsername("")
        setEmail("")
        setPassword("")
        setPassword("")
        setPin("")
        setAreaId("")
    }

    const handleEdit = (user: Cobrador) => {
        setEditingUser(user)
        setName(user.name || "")
        setUsername(user.username)
        setEmail(user.email || "")
        setPin(user.securityPin || "") // Requires backend to expose PIN (usually bad practice, but for admin management OK or just overwrite)
        setAreaId(user.areaId || "")
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        showAlert(
            "Excluir Cobrador",
            "Tem certeza que deseja excluir este cobrador? Esta ação não pode ser desfeita.",
            "warning",
            true, // showCancel
            async () => {
                try {
                    const res = await fetch(`${AppConfig.api.baseUrl}/users/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    hideAlert()
                    if (res.ok) {
                        showAlert("Cobrador removido", "O cobrador foi removido com sucesso.", "success")
                        fetchCobradores()
                    } else {
                        showAlert("Erro", "Não foi possível remover o cobrador.", "error")
                    }
                } catch (e: any) {
                    showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
                }
            },
            "Sim, Excluir",
            "Cancelar"
        )
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Wallet className="w-8 h-8 text-emerald-500" />}
                title="Gestão de Cobradores"
                description="Cadastre e gerencie os responsáveis pelas sangrias."
                onRefresh={fetchCobradores}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cobrador..."
                            className="pl-9 bg-background border-border h-9 shadow-sm text-xs font-semibold"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => { resetForm(); setIsDialogOpen(true) }}
                                className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 h-9"
                                size="sm"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Novo Cobrador
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-foreground">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Wallet className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    {editingUser ? 'Editar Cobrador' : 'Adicionar Novo Cobrador'}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {editingUser ? 'Atualize os dados do cobrador.' : 'Preencha os dados abaixo para cadastrar um cobrador.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Nome Completo</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: João Silva" className="pl-9 bg-muted/50 border-input" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Usuário (Login)</label>
                                        <div className="relative">
                                            <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: joaosilva" className="pl-9 bg-muted/50 border-input" value={username} onChange={e => setUsername(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Email (Opcional)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="Ex: joao@email.com" className="pl-9 bg-muted/50 border-input" value={email} onChange={e => setEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">{editingUser ? "Nova Senha (opcional)" : "Senha"}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                placeholder={editingUser ? "Deixe em branco para manter" : "Senha de acesso"}
                                                className="pl-9 bg-muted/50 border-input"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required={!editingUser}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">PIN de Segurança (4 dígitos)</label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type={showPin ? "text" : "password"}
                                                    maxLength={4}
                                                    placeholder="Ex: 1234"
                                                    className="pl-9 bg-muted/50 border-input"
                                                    value={pin}
                                                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    required
                                                />
                                            </div>
                                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 border-input" onClick={() => setShowPin(!showPin)}>
                                                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium italic">O PIN é usado para confirmar sangrias no celular do cambista.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Praça (Área de Atuação)</label>
                                        <select
                                            className="w-full h-10 px-3 py-2 bg-muted/50 border border-input rounded-md text-sm outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                                            value={areaId}
                                            onChange={e => setAreaId(e.target.value)}
                                        >
                                            <option value="">Nenhuma praça selecionada</option>
                                            {areas.map(area => (
                                                <option key={area.id} value={area.id}>
                                                    {area.city} - {area.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]">
                                        {editingUser ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                        {editingUser ? "Salvar" : "Criar Cobrador"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </StandardPageHeader>

            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50 border-b border-border/60 bg-muted/20">
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Praça</TableHead>
                                    <TableHead>Matrícula (Usuário)</TableHead>
                                    <TableHead>PIN de Segurança</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    const filtered = cobradores.filter(c =>
                                        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        c.area?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        c.area?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                    );

                                    const paginated = limit === "all" ? filtered : filtered.slice((page - 1) * limit, Number(page) * Number(limit));

                                    if (filtered.length === 0) return (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic font-medium">
                                                Nenhum cobrador encontrado.
                                            </TableCell>
                                        </TableRow>
                                    );

                                    return paginated.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase ring-1 ring-emerald-500/20">
                                                        {user.username.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                                                            {user.name || user.username}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono italic">
                                                            <Mail className="w-3 h-3 text-emerald-500/50" />
                                                            {user.email || "Sem email"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.area ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-bold text-xs">{user.area.city}</span>
                                                        <span className="text-muted-foreground text-[10px] font-medium italic">{user.area.name}</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground border-dashed">Sem praça</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono bg-muted/50 text-emerald-700 hover:bg-muted font-bold text-[10px] px-2 py-0.5">
                                                    @{user.username}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.securityPin ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md border border-emerald-100/50">
                                                        <Lock className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold">DEFINIDO</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-red-500 bg-red-50 w-fit px-2 py-1 rounded-md border border-red-100/50">
                                                        <Lock className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold">PENDENTE</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 gap-1.5 uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Ativo
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 border-red-500/30 hover:bg-red-50"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ));
                                })()}
                            </TableBody>
                        </Table>
                        <StandardPagination
                            currentPage={page}
                            totalPages={limit === "all" ? 1 : Math.ceil(cobradores.filter(c =>
                                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.area?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.area?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length / limit)}
                            limit={limit}
                            onPageChange={setPage}
                            onLimitChange={(l) => {
                                setLimit(l)
                                setPage(1)
                            }}
                            totalItems={cobradores.filter(c =>
                                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.area?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                c.area?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length}
                        />
                )}
            </CardContent>
        </Card >
        </div >
    )
}
