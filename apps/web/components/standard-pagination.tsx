"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface StandardPaginationProps {
    currentPage: number
    totalPages: number
    limit: number | "all"
    onPageChange: (page: number) => void
    onLimitChange: (limit: number | "all") => void
    totalItems?: number
}

export function StandardPagination({
    currentPage,
    totalPages,
    limit,
    onPageChange,
    onLimitChange,
    totalItems
}: StandardPaginationProps) {
    return (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/30 w-full rounded-b-lg">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Exibir</span>
                <Select
                    value={String(limit)}
                    onValueChange={(v) => {
                        onLimitChange(v === "all" ? "all" : Number(v))
                    }}
                >
                    <SelectTrigger className="w-[85px] h-8 bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">por página</span>
                {totalItems !== undefined && (
                    <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
                        (Total: {totalItems})
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-background"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || limit === "all"}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                </Button>
                <div className="text-sm font-medium">
                    Página {limit === "all" ? 1 : currentPage} de {limit === "all" ? 1 : Math.max(1, totalPages)}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-background"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0 || limit === "all"}
                >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}
