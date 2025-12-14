"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { CustomAlert, AlertType } from "../components/custom-alert"

interface AlertContextProps {
    showAlert: (
        title: string,
        message: string,
        type?: AlertType,
        showCancel?: boolean,
        onConfirm?: () => void,
        confirmText?: string,
        cancelText?: string
    ) => void
    hideAlert: () => void
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined)

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<{
        visible: boolean
        title: string
        message: string
        type: AlertType
        showCancel: boolean
        onConfirm?: () => void
        confirmText: string
        cancelText: string
    }>({
        visible: false,
        title: "",
        message: "",
        type: "success",
        showCancel: false,
        confirmText: "Entendido",
        cancelText: "Cancelar"
    })

    const showAlert = (
        title: string,
        message: string,
        type: AlertType = "success",
        showCancel = false,
        onConfirm?: () => void,
        confirmText = "Entendido",
        cancelText = "Cancelar"
    ) => {
        setConfig({
            visible: true,
            title,
            message,
            type,
            showCancel,
            onConfirm,
            confirmText,
            cancelText
        })
    }

    const hideAlert = () => {
        setConfig(prev => ({ ...prev, visible: false }))
    }

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={config.visible}
                title={config.title}
                message={config.message}
                type={config.type}
                showCancel={config.showCancel}
                onConfirm={() => {
                    if (config.onConfirm) {
                        config.onConfirm()
                        // Automatically hide if confirm action is sync? 
                        // Mobile impl calls hideAlert() manually in onConfirm sometimes, or CustomAlert calls onConfirm or onClose.
                        // Our Component calls onConfirm -> if provided, run it.
                        // It's safer to let the handler decide when to close, OR close automatically.
                        // Mobile: Component calls onConfirm or onClose.
                        // Here: Component calls handleConfirm -> onConfirm() else onClose().
                        // Replicating that: Context purely passes the function. 
                        // But if onConfirm is synchronous and doesn't close, we might want to auto-close?
                        // Let's stick to component logic: render passes generic onClose to modal.
                    } else {
                        hideAlert()
                    }
                }}
                onClose={hideAlert}
                confirmText={config.confirmText}
                cancelText={config.cancelText}
            />
        </AlertContext.Provider>
    )
}

export const useAlert = () => {
    const context = useContext(AlertContext)
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider")
    }
    return context
}
