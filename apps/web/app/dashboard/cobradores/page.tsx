"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { AppConfig } from "../../AppConfig"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff, Users, Search, Filter, Loader2, Lock, Wallet } from "lucide-react"
import {
    Dialog,
    DialogContent,
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

interface Cobrador {
    id: string
    name: string
    username: string
    email: string
    role: string
    securityPin?: string
    area?: {
        name: string
    }
}

export default function CobradoresPage() {
    const { token } = useAuth()
    const router = useRouter()
    const { showAlert } = useAlert()

    const [cobradores, setCobradores] = useState<Cobrador[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Cobrador | null>(null)

    // Form states
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [showPin, setShowPin] = useState(false)

    useEffect(() => {
        fetchCobradores()
    }, [token])

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
            securityPin: pin
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
        setPin("")
    }

    const handleEdit = (user: Cobrador) => {
        setEditingUser(user)
        setName(user.name || "")
        setUsername(user.username)
        setEmail(user.email || "")
        setPin(user.securityPin || "") // Requires backend to expose PIN (usually bad practice, but for admin management OK or just overwrite)
        // If backend doesn't return pin for security, we might leave it blank to indicate "Unchanged". 
        // For now let's assume admin can overwrite.
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return

        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                showAlert("Cobrador removido", "success")
                fetchCobradores()
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Wallet className="w-8 h-8 text-blue-500" />
                        </div>
                        Gestão de Cobradores
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Cadastre e gerencie os responsáveis pelas sangrias.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Cobrador
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Cobrador' : 'Novo Cobrador'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required />
                        <Input placeholder="Usuário (Login)" value={username} onChange={e => setUsername(e.target.value)} required />
                        <Input type="email" placeholder="Email (Opcional)" value={email} onChange={e => setEmail(e.target.value)} />

                        <div className="relative">
                            <Input
                                type="password"
                                placeholder={editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required={!editingUser}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                type={showPin ? "text" : "password"}
                                maxLength={4}
                                placeholder="PIN de Segurança (4 dígitos)"
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                required
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => setShowPin(!showPin)}>
                                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">O PIN é usado para confirmar sangrias no celular do cambista.</p>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Search and Filter Card */}
            <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Equipe de Cobrança</CardTitle>
                            <CardDescription>Lista de todos os cobradores cadastrados no sistema.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cobrador..."
                                    className="pl-9 bg-muted/50 border-border"
                                // Add search logic if needed, or keep visual for now
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50">
                                    <TableHead className="w-[300px]">Nome</TableHead>
                                    <TableHead>Matrícula (Usuário)</TableHead>
                                    <TableHead>PIN de Segurança</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cobradores.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                                                    {user.username.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground">{user.name || user.username}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email || "Sem email"}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono bg-muted text-muted-foreground hover:bg-muted">
                                                {user.username}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.securityPin ? (
                                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                                                    <Lock className="h-3 w-3" />
                                                    <span className="text-xs font-medium">Definido</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-600 bg-red-50 w-fit px-2 py-1 rounded-md">
                                                    <Lock className="h-3 w-3" />
                                                    <span className="text-xs font-medium">Pendente</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Ativo
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cobradores.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Nenhum cobrador cadastrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
