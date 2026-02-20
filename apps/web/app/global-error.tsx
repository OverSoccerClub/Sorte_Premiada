'use client'

import { AlertCircle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-md p-6 bg-card rounded-xl border shadow-sm">
                        <AlertCircle className="w-12 h-12 text-red-500 opacity-80" />
                        <h2 className="text-xl font-semibold">Erro Interno do Servidor (500)</h2>
                        <p className="text-sm text-muted-foreground break-all">
                            {error?.message || "Ocorreu um erro crítico."}
                        </p>
                        <button
                            onClick={() => reset()}
                            className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition-colors"
                        >
                            Recarregar Aplicação
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
