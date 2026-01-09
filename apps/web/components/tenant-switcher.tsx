"use client"

import { useAuth } from "@/context/auth-context"
import { useCompany } from "@/context/company-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"

/**
 * TenantSwitcher
 * 
 * Componente para usuários MASTER selecionarem qual empresa desejam visualizar/gerenciar.
 * Aparece apenas para usuários com role MASTER.
 * 
 * Funcionalidades:
 * - Lista todas as empresas cadastradas
 * - Permite trocar entre empresas
 * - Atualiza todo o dashboard com dados da empresa selecionada
 */
export function TenantSwitcher() {
    const { user } = useAuth()
    const { availableCompanies, currentCompanyId, switchCompany, loading } = useCompany()

    // Apenas MASTER users podem ver este componente
    if (user?.role !== 'MASTER') {
        return null
    }

    // Se não há empresas ou está carregando, não mostrar
    if (loading || availableCompanies.length === 0) {
        return null
    }

    return (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 shadow-sm">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] tracking-wider font-bold px-2 py-0.5 h-5">
                    MASTER
                </Badge>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Visualizando:
                </span>
            </div>

            <Select
                value={currentCompanyId}
                onValueChange={switchCompany}
            >
                <SelectTrigger className="w-[200px] h-8 text-xs font-medium bg-transparent border-0 focus:ring-0 px-0 shadow-none text-foreground">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        <SelectValue placeholder="Selecione..." />
                    </div>
                </SelectTrigger>
                <SelectContent align="end">
                    {availableCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-xs">
                            <span className="font-medium">{company.companyName}</span>
                            <span className="ml-2 text-slate-400 text-[10px]">{company.slug}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
