"use client"

import { ReactNode } from "react"

interface StandardCardHeaderProps {
    icon: ReactNode
    title: string
    description?: string
    children?: ReactNode
}

export function StandardCardHeader({
    icon,
    title,
    description,
    children
}: StandardCardHeaderProps) {
    return (
        <div
            data-slot="card-header"
            className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 py-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] bg-muted/30 border-b border-border"
        >
            <div className="flex items-center justify-between">
                <div
                    data-slot="card-title"
                    className="leading-none font-semibold flex items-center gap-2"
                >
                    {icon}
                    {title}
                </div>
                {children && (
                    <div data-slot="card-action" className="flex items-center gap-2">
                        {children}
                    </div>
                )}
            </div>
            {description && (
                <div
                    data-slot="card-description"
                    className="text-muted-foreground text-sm"
                >
                    {description}
                </div>
            )}
        </div>
    )
}
