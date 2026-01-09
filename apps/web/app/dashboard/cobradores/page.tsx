"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"
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
import { useActiveCompanyId } from "@/context/use-active-company"

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
    // New fields
    address?: string
    city?: string
    state?: string
    zipCode?: string
    phone?: string
    neighborhood?: string
    number?: string
    complement?: string
    cpf?: string
}

interface Area {
    id: string
    name: string
    city: string
    state: string
}

export default function CobradoresPage() {
    const { token } = useAuth()
    const activeCompanyId = useActiveCompanyId()
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
    const [showPassword, setShowPassword] = useState(false)

    // Address & Contact states
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [zipCode, setZipCode] = useState("")
    const [phone, setPhone] = useState("")
    const [neighborhood, setNeighborhood] = useState("")
    const [number, setNumber] = useState("")
    const [complement, setComplement] = useState("")
    const [cpf, setCpf] = useState("")

    useEffect(() => {
        if (token) {
            fetchCobradores()
            fetchAreas()
        }
    }, [token, activeCompanyId])

    const fetchAreas = async () => {
        try {
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/areas?${queryParams.toString()}`, {
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
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
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
            showAlert("Validação", "Preencha os campos obrigatórios. PIN deve ter 4 dígitos.", "error")
            return
        }

        // Validação de email
        if (email && email.trim() !== "") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                showAlert("Email Inválido", "Por favor, insira um endereço de email válido.", "error")
                return
            }
        }

        const payload: any = {
            name,
            username,
            email: email && email.trim() !== "" ? email : undefined,
            role: 'COBRADOR',
            securityPin: pin,
            areaId: areaId || undefined,
            // New fields
            address,
            city,
            state,
            zipCode,
            phone,
            neighborhood,
            number,
            complement,
            cpf
        }

        if (password) payload.password = password

        const url = editingUser
            ? `${API_URL}/users/${editingUser.id}`
            : `${API_URL}/users`

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

            showAlert("Sucesso!", editingUser ? "Cobrador atualizado com sucesso!" : "Cobrador criado com sucesso!", "success")
            setIsDialogOpen(false)
            resetForm()
            // Recarregar a lista de cobradores
            await fetchCobradores()
        } catch (e: any) {
            showAlert("Erro", e.message || "Erro ao salvar cobrador.", "error")
        }
    }

    const resetForm = () => {
        setEditingUser(null)
        setName("")
        setUsername("")
        setEmail("")
        setPassword("")
        setPin("")
        setAreaId("")
        setShowPassword(false)
        setShowPin(false)
        // Reset added fields
        setAddress("")
        setCity("")
        setState("")
        setZipCode("")
        setPhone("")
        setNeighborhood("")
        setNumber("")
        setComplement("")
        setCpf("")
    }

    const handleEdit = (user: Cobrador) => {
        setEditingUser(user)
        setName(user.name || "")
        setUsername(user.username)
        setEmail(user.email || "")
        setPin(user.securityPin || "")
        setAreaId(user.areaId || "")
        // Set added fields
        setAddress(user.address || "")
        setCity(user.city || "")
        setState(user.state || "")
        setZipCode(user.zipCode || "")
        setPhone(user.phone || "")
        setNeighborhood(user.neighborhood || "")
        setNumber(user.number || "")
        setComplement(user.complement || "")
        setCpf(user.cpf || "")

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
                    const res = await fetch(`${API_URL}/users/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    hideAlert()
                    if (res.ok) {
                        showAlert("Removido", "O cobrador foi removido com sucesso.", "success")
                        // Recarregar a lista de cobradores
                        await fetchCobradores()
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
                                        <label className="text-xs font-bold text-muted-foreground">Nome Completo</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: João Silva" className="pl-9 bg-muted/50 border-input" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground">Usuário (Login)</label>
                                        <div className="relative">
                                            <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Ex: joaosilva" className="pl-9 bg-muted/50 border-input" value={username} onChange={e => setUsername(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground">Email (Opcional)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="Ex: joao@email.com" className="pl-9 bg-muted/50 border-input" value={email} onChange={e => setEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground">CPF</label>
                                            <Input placeholder="000.000.000-00" className="bg-muted/50 border-input" value={cpf} onChange={e => setCpf(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground">Telefone/WhatsApp</label>
                                            <Input placeholder="(00) 00000-0000" className="bg-muted/50 border-input" value={phone} onChange={e => setPhone(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t border-border/50 my-2 pt-2">
                                        <h3 className="text-sm font-semibold mb-3 text-emerald-600">Endereço</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">CEP</label>
                                                <Input placeholder="00000-000" className="bg-muted/50 border-input" value={zipCode} onChange={e => setZipCode(e.target.value)} />
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">Cidade</label>
                                                <Input placeholder="Cidade" className="bg-muted/50 border-input" value={city} onChange={e => setCity(e.target.value)} />
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">UF</label>
                                                <Input placeholder="UF" maxLength={2} className="bg-muted/50 border-input" value={state} onChange={e => setState(e.target.value.toUpperCase())} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                                            <div className="space-y-2 sm:col-span-3">
                                                <label className="text-xs font-bold text-muted-foreground">Rua / Logradouro</label>
                                                <Input placeholder="Rua das Flores" className="bg-muted/50 border-input" value={address} onChange={e => setAddress(e.target.value)} />
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">Número</label>
                                                <Input placeholder="123" className="bg-muted/50 border-input" value={number} onChange={e => setNumber(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">Bairro</label>
                                                <Input placeholder="Centro" className="bg-muted/50 border-input" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">Complemento</label>
                                                <Input placeholder="Apto 101" className="bg-muted/50 border-input" value={complement} onChange={e => setComplement(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>


                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground">CPF</label>
                                            <Input placeholder="000.000.000-00" className="bg-muted/50 border-input" value={cpf} onChange={e => setCpf(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground">Telefone/WhatsApp</label>
                                            <Input placeholder="(00) 00000-0000" className="bg-muted/50 border-input" value={phone} onChange={e => setPhone(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t border-border/50 my-2 pt-2">
                                        <h3 className="text-sm font-semibold mb-3 text-emerald-600">Endereço</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">CEP</label>
                                                <Input placeholder="00000-000" className="bg-muted/50 border-input" value={zipCode} onChange={e => setZipCode(e.target.value)} />
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">Cidade</label>
                                                <Input placeholder="Cidade" className="bg-muted/50 border-input" value={city} onChange={e => setCity(e.target.value)} />
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">UF</label>
                                                <Input placeholder="UF" maxLength={2} className="bg-muted/50 border-input" value={state} onChange={e => setState(e.target.value.toUpperCase())} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                                            <div className="space-y-2 sm:col-span-3">
                                                <label className="text-xs font-bold text-muted-foreground">Rua / Logradouro</label>
                                                <Input placeholder="Rua das Flores" className="bg-muted/50 border-input" value={address} onChange={e => setAddress(e.target.value)} />
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-xs font-bold text-muted-foreground">Número</label>
                                                <Input placeholder="123" className="bg-muted/50 border-input" value={number} onChange={e => setNumber(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">Bairro</label>
                                                <Input placeholder="Centro" className="bg-muted/50 border-input" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">Complemento</label>
                                                <Input placeholder="Apto 101" className="bg-muted/50 border-input" value={complement} onChange={e => setComplement(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground">{editingUser ? "Nova Senha (opcional)" : "Senha"}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder={editingUser ? "Deixe em branco para manter" : "Senha de acesso"}
                                                className="pl-9 pr-10 bg-muted/50 border-input"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required={!editingUser}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground">PIN de Segurança (4 dígitos)</label>
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
                                        <label className="text-xs font-bold text-muted-foreground">Praça (Área de Atuação)</label>
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

            <Card className="border-border shadow-sm bg-card">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/50 border-b border-border/60 bg-muted/20">
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Empresa</TableHead>
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
                                                    <span className="text-sm text-foreground">{(user as any).company?.companyName || "-"}</span>
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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
