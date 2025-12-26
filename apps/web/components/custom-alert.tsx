"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, TriangleAlert, Info, X } from "lucide-react"

export type AlertType = "success" | "error" | "warning" | "info"

export interface CustomAlertProps {
    visible: boolean
    title: string
    message: string
    type: AlertType
    onClose: () => void
    showCancel?: boolean
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
}

export function CustomAlert({
    visible,
    title,
    message,
    type,
    onClose,
    showCancel = false,
    onConfirm,
    confirmText = "Entendido",
    cancelText = "Cancelar"
}: CustomAlertProps) {
    const [render, setRender] = useState(visible)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        if (visible) {
            setRender(true)
            // Small delay to allow render before animation starts
            setTimeout(() => setAnimate(true), 10)
        } else {
            setAnimate(false)
            // Wait for animation to finish before removing from DOM
            const timer = setTimeout(() => setRender(false), 200)
            return () => clearTimeout(timer)
        }
    }, [visible])

    if (!render) return null

    let Icon = CheckCircle
    // Using semantic colors with opacity for premium feel
    let iconBgClass = "bg-emerald-500/20"
    let iconTextClass = "text-emerald-500"
    let iconBorderClass = "border-emerald-500/50"
    let buttonClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"

    if (type === "error") {
        Icon = AlertCircle
        iconBgClass = "bg-red-500/20"
        iconTextClass = "text-red-500"
        iconBorderClass = "border-red-500/50"
        buttonClass = "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
    } else if (type === "warning") {
        Icon = TriangleAlert
        iconBgClass = "bg-amber-500/20"
        iconTextClass = "text-amber-500"
        iconBorderClass = "border-amber-500/50"
        buttonClass = "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20"
    } else if (type === "info") {
        Icon = Info
        iconBgClass = "bg-blue-500/20"
        iconTextClass = "text-blue-500"
        iconBorderClass = "border-blue-500/50"
        buttonClass = "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20"
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        } else {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-sans">
            {/* Backdrop with blur */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Alert Card */}
            <div className={`
                relative w-full max-w-sm rounded-[24px] p-8 pt-10
                flex flex-col items-center 
                bg-popover border border-white/5 shadow-2xl
                transition-all duration-300 ease-out
                ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
            `}>
                {/* Floating Icon with Glow */}
                <div className={`
                    absolute -top-10 
                    w-20 h-20 rounded-full 
                    flex items-center justify-center 
                    backdrop-blur-md bg-popover
                    border-4 ${iconBorderClass}
                    shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)]
                `}>
                    <div className={`w-full h-full rounded-full ${iconBgClass} flex items-center justify-center`}>
                        <Icon className={`w-10 h-10 ${iconTextClass}`} strokeWidth={2} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground text-center mt-6 mb-3 tracking-tight">
                    {title}
                </h2>

                <p className="text-muted-foreground text-center mb-8 leading-relaxed text-[0.95rem]">
                    {message}
                </p>

                <div className="w-full flex gap-3">
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className="
                                flex-1 py-3.5 rounded-xl border border-white/10 
                                bg-secondary/50 hover:bg-secondary 
                                text-muted-foreground hover:text-foreground
                                font-medium text-sm transition-all active:scale-[0.98]
                            "
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`
                            flex-1 py-3.5 rounded-xl 
                            font-bold text-sm tracking-wide uppercase
                            shadow-lg transition-all active:scale-[0.98]
                            ${buttonClass}
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
