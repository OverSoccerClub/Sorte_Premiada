"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { API_URL } from "@/lib/api"
import { useAuth } from "./auth-context"

interface CompanySettings {
    id?: string
    companyName: string
    slogan?: string
    logoUrl?: string
    primaryColor?: string
    phone?: string
    whatsapp?: string
    email?: string
    plan?: {
        name: string
        features: string[]
    }
}

interface Company {
    id: string
    slug: string
    companyName: string
    createdAt: string
}

interface CompanyContextType {
    settings: CompanySettings
    loading: boolean
    currentCompanyId?: string
    availableCompanies: Company[]
    switchCompany: (companyId: string) => Promise<void>
    refreshSettings: () => Promise<void>
}

const defaultSettings: CompanySettings = {
    companyName: "A Perseverança",
    slogan: "Cambista Edition",
    primaryColor: "#506878",
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth()
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings)
    const [loading, setLoading] = useState(true)
    const [currentCompanyId, setCurrentCompanyId] = useState<string | undefined>()
    const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])

    const fetchSettings = async (companyId?: string) => {
        try {
            setLoading(true)

            // Se MASTER e companyId fornecido, buscar settings dessa empresa
            // Senão, buscar settings da empresa do usuário ou default
            const url = companyId
                ? `${API_URL}/company/settings?targetCompanyId=${companyId}`
                : `${API_URL}/company/settings`

            const response = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })

            if (response.ok) {
                const data = await response.json()
                setSettings({
                    ...defaultSettings,
                    ...data
                })
                // CRÍTICO: Só atualizar o ID se ele for compatível ou se não tivermos um ID alvo
                // Se o backend retornar um ID diferente do solicitado, pode ser que o usuário não tenha permissão
                // ou que o backend esteja retornando default.

                // Se foi solicitado um companyId específico (targetCompanyId no URL da API)
                if (companyId && data.id !== companyId) {
                    console.warn(`[CompanyContext] Mismatch! Requested ${companyId} but got ${data.id}`)
                } else {
                    setCurrentCompanyId(data.id)
                }
            }
        } catch (error) {
            console.error("Failed to fetch company settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableCompanies = async () => {
        if (user?.role !== 'MASTER' || !token) return

        try {
            const response = await fetch(`${API_URL}/company/all`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.ok) {
                const companies = await response.json()
                setAvailableCompanies(companies)
            }
        } catch (error) {
            console.error("Failed to fetch available companies:", error)
        }
    }

    const switchCompany = async (companyId: string) => {
        try {
            // CRÍTICO: Salvar empresa selecionada no sessionStorage
            sessionStorage.setItem('selectedCompanyId', companyId)

            // 1. Atualizar Estado Local Imediatamente (Feedback Visual)
            setCurrentCompanyId(companyId)

            // 2. Buscar Configurações da Nova Empresa
            await fetchSettings(companyId)

            // NÃO usar window.location.reload() - deixa o React reagir às mudanças de estado
        } catch (error) {
            console.error("Erro ao trocar de empresa:", error)
        }
    }

    useEffect(() => {
        // Evitar execução se usuário ainda não estiver carregado
        if (!user && !token) return;

        // CRÍTICO: Para MASTER, verificar se há empresa selecionada no sessionStorage
        let targetCompanyId: string | undefined

        // Tentar recuperar do estado local primeiro (se já definido), depois storage, depois user default
        if (user?.role === 'MASTER') {
            const savedCompanyId = sessionStorage.getItem('selectedCompanyId')

            if (savedCompanyId) {
                targetCompanyId = savedCompanyId
            } else if (user?.companyId) {
                targetCompanyId = user.companyId
            }
        } else if (user?.companyId) {
            // Usuários normais sempre usam sua própria empresa
            targetCompanyId = user.companyId
        }

        // Se identificamos um ID alvo, atualizar estado e buscar settings
        if (targetCompanyId) {
            // Só atualizar o estado se for diferente para evitar loops
            if (currentCompanyId !== targetCompanyId) {
                setCurrentCompanyId(targetCompanyId)
            }
            fetchSettings(targetCompanyId)
        } else {
            // Fallback para comportamento padrão
            fetchSettings()
        }

        // Se MASTER, carregar lista de empresas disponíveis
        if (user?.role === 'MASTER') {
            fetchAvailableCompanies()
        }
    }, [user, token]) // Remover dependência implícita que causaria loops

    useEffect(() => {
        if (settings.companyName) {
            document.title = settings.companyName
        }
    }, [settings.companyName])

    return (
        <CompanyContext.Provider value={{
            settings,
            loading,
            currentCompanyId,
            availableCompanies,
            switchCompany,
            refreshSettings: () => fetchSettings(currentCompanyId)
        }}>
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const context = useContext(CompanyContext)
    if (context === undefined) {
        throw new Error("useCompany must be used within a CompanyProvider")
    }
    return context
}
