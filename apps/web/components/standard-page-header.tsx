"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { ReactNode } from "react"

interface StandardPageHeaderProps {
    icon: ReactNode
    title: string
    description?: string
    children?: ReactNode // For filters
    onRefresh?: () => void
    refreshing?: boolean
}

export function StandardPageHeader({
    icon,
    title,
    description,
    children,
    onRefresh,
    refreshing = false
}: StandardPageHeaderProps) {
    return (
        <div className="bg-muted/30 border-b border-border p-4 mb-6 rounded-t-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    {children}
                    {onRefresh && (
                        <Button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                            size="sm"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            Atualizar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
