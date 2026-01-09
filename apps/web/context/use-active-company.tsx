"use client"

import { useAuth } from "./auth-context"
import { useCompany } from "./company-context"

/**
 * Hook para obter o ID da empresa ativa no contexto atual
 * 
 * CRÍTICO: Este hook deve ser usado em TODOS os lugares onde você precisa
 * filtrar dados por empresa. Ele garante que:
 * - Usuários MASTER vejam dados da empresa SELECIONADA (não a padrão)
 * - Usuários normais vejam apenas dados da SUA empresa
 * 
 * @returns companyId da empresa ativa no contexto
 */
export function useActiveCompanyId(): string | undefined {
    const { user } = useAuth()
    const { currentCompanyId } = useCompany()

    // Para MASTER, usar empresa selecionada (currentCompanyId)
    // Para outros usuários, usar sua própria empresa
    if (user?.role === 'MASTER') {
        return currentCompanyId
    }

    return user?.companyId
}
