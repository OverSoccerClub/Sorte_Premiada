"use client"

import { useCompany } from "@/context/company-context"
import { useAuth } from "@/context/auth-context"
import { Building2, Crown } from "lucide-react"
import { PlanUsageDialog } from "./license/plan-usage-dialog"

/**
 * CompanyIndicator
 * 
 * Componente que exibe informações da empresa atual no sidebar.
 * Mostra o nome da empresa e um badge especial para usuários MASTER.
 */
export function CompanyIndicator() {
    const { settings, loading, currentCompanyId } = useCompany()
    const { user } = useAuth()

    if (loading) {
        return (
            <div className="px-4 py-3 bg-sidebar-accent/50 rounded-lg border border-sidebar-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
        )
    }

    return (
        <PlanUsageDialog trigger={
            <div className="px-4 py-3 bg-sidebar-accent/50 rounded-lg border border-sidebar-border cursor-pointer hover:bg-sidebar-accent hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-sidebar-foreground transition-colors">
                        Empresa
                    </span>
                    {user?.role === 'MASTER' && (
                        <span title="Modo MASTER" className="ml-auto flex">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                        {settings.companyName}
                    </p>
                    {settings.plan && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 uppercase font-bold tracking-wider dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
                            {settings.plan.name}
                        </span>
                    )}
                </div>
                {settings.slogan && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {settings.slogan}
                    </p>
                )}
                {user?.role === 'MASTER' && currentCompanyId && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mt-1 truncate" title={currentCompanyId}>
                        ID: {currentCompanyId.slice(0, 8)}...
                    </p>
                )}

                {/* Visual hint that it's clickable */}
                <div className="w-full h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        } />
    )
}
