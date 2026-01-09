"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { API_URL } from "@/lib/api"

interface User {
    id: string
    username: string
    name?: string
    email?: string
    role: string
    companyId?: string // Multi-tenant: ID da empresa do usuário
}

interface AuthContextProps {
    user: User | null
    token: string | null
    loading: boolean
    signIn: (token: string) => Promise<void>
    signOut: () => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
            setToken(storedToken)
            fetchProfile(storedToken)
        } else {
            setLoading(false)
            if (pathname !== "/" && !pathname.includes("/login")) {
                router.replace("/")
            }
        }
    }, [])

    const fetchProfile = async (accessToken: string) => {
        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            if (res.ok) {
                const data = await res.json()
                setUser(data)
            } else {
                signOut()
            }
        } catch (e) {
            console.error(e)
            signOut()
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (accessToken: string) => {
        localStorage.setItem("token", accessToken)
        setToken(accessToken)
        await fetchProfile(accessToken)
        router.push("/dashboard")
    }

    const signOut = () => {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        router.push("/")
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
