"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { API_URL } from "@/lib/api"

interface CompanySettings {
    companyName: string
    slogan?: string
    logoUrl?: string
    primaryColor?: string
    phone?: string
    whatsapp?: string
    email?: string
}

interface CompanyContextType {
    settings: CompanySettings
    loading: boolean
    refreshSettings: () => Promise<void>
}

const defaultSettings: CompanySettings = {
    companyName: "Fezinha de Hoje",
    slogan: "Cambista Edition",
    primaryColor: "#506878",
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings)
    const [loading, setLoading] = useState(true)

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/company/settings`)
            if (response.ok) {
                const data = await response.json()
                setSettings({
                    ...defaultSettings,
                    ...data
                })
            }
        } catch (error) {
            console.error("Failed to fetch company settings:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    return (
        <CompanyContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
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
