"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { Clock } from "lucide-react"
import { useAlert } from "@/context/alert-context"

const TIMEOUT_MINUTES = 15
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000

export function SessionTimer() {
    const { signOut, user } = useAuth()
    const { showAlert } = useAlert()
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_MS)
    const [isActive, setIsActive] = useState(true)

    // Reset timer on user activity
    const resetTimer = useCallback(() => {
        setTimeLeft(TIMEOUT_MS)
        setIsActive(true)
    }, [])

    useEffect(() => {
        // Events to detect activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

        // Throttled event listener to avoid performance issues
        let timeout: NodeJS.Timeout
        const handleActivity = () => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    resetTimer()
                    // @ts-ignore
                    timeout = null
                }, 1000) // Throttle to 1s
            }
        }

        events.forEach(event => window.addEventListener(event, handleActivity))

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity))
            if (timeout) clearTimeout(timeout)
        }
    }, [resetTimer])

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1000) {
                    clearInterval(interval)
                    handleLogout()
                    return 0
                }
                return prev - 1000
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const handleLogout = () => {
        showAlert("Sessão Expirada", "Você foi desconectado por inatividade.", "warning")
        signOut()
    }

    // Format time mm:ss
    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    // Visual warning when low
    const isLow = minutes < 1

    if (!user) return null

    return (
        <div className={`flex items-center gap-2 text-xs font-mono border px-2 py-1 rounded-md transition-colors duration-500
            ${isLow ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-muted text-muted-foreground border-border'}
        `} title="Tempo restante de sessão">
            <Clock className="w-3 h-3" />
            <span>{formattedTime}</span>
        </div>
    )
}
