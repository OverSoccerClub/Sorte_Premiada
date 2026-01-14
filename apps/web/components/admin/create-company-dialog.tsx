import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Building2, User } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"

interface CreateCompanyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateCompanyDialog({ open, onOpenChange, onSuccess }: CreateCompanyDialogProps) {
    const { showAlert } = useAlert()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        // Company
        companyName: "",
        slug: "",
        slogan: "",
        primaryColor: "#50C878",
        // Admin User
        adminName: "",
        adminUsername: "",
        adminEmail: "",
        adminPassword: "",
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_URL}/company`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erro ao criar empresa")
            }

            showAlert("Sucesso!", "Empresa criada com sucesso!", "success")
            onSuccess()
            onOpenChange(false)
            setFormData({
                companyName: "",
                slug: "",
                slogan: "",
                primaryColor: "#50C878",
                adminName: "",
                adminUsername: "",
                adminEmail: "",
                adminPassword: "",
            })
        } catch (error: any) {
            console.error(error)
            showAlert("Erro!", error.message || "Falha ao criar empresa.", "error")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Empresa (Tenant)</DialogTitle>
                    <DialogDescription>
                        Crie uma nova empresa no sistema. Isso provisionará o ambiente e um usuário Admin inicial.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">

                    {/* Company Section */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-semibold text-lg">Dados da Empresa</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nome da Empresa *</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange("companyName", e.target.value)}
                                    placeholder="Ex: Banca Elite"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Identificador (Slug/URL) *</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    placeholder="Ex: banca-elite"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Único no sistema.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="slogan">Slogan (Opcional)</Label>
                                <Input
                                    id="slogan"
                                    value={formData.slogan}
                                    onChange={(e) => handleChange("slogan", e.target.value)}
                                    placeholder="Ex: A sua sorte está aqui"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Cor Principal</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primaryColor"
                                        type="color"
                                        value={formData.primaryColor}
                                        onChange={(e) => handleChange("primaryColor", e.target.value)}
                                        className="w-12 h-10 p-1 px-1 py-1"
                                    />
                                    <Input
                                        value={formData.primaryColor}
                                        onChange={(e) => handleChange("primaryColor", e.target.value)}
                                        placeholder="#000000"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin User Section */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-semibold text-lg">Administrador Inicial</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminName">Nome do Responsável *</Label>
                            <Input
                                id="adminName"
                                value={formData.adminName}
                                onChange={(e) => handleChange("adminName", e.target.value)}
                                placeholder="João da Silva"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="adminUsername">Usuário (Login) *</Label>
                                <Input
                                    id="adminUsername"
                                    value={formData.adminUsername}
                                    onChange={(e) => handleChange("adminUsername", e.target.value)}
                                    placeholder="joao_admin"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adminPassword">Senha Inicial *</Label>
                                <Input
                                    id="adminPassword"
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={(e) => handleChange("adminPassword", e.target.value)}
                                    placeholder="******"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">Email (Opcional)</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                value={formData.adminEmail}
                                onChange={(e) => handleChange("adminEmail", e.target.value)}
                                placeholder="joao@exemplo.com"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Criar Empresa
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
