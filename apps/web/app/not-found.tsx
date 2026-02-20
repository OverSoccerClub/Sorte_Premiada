import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center text-center space-y-4 max-w-md p-6 bg-card rounded-xl border shadow-sm">
                <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
                <h1 className="text-4xl font-bold tracking-tight">404</h1>
                <h2 className="text-xl font-semibold text-muted-foreground">Página não encontrada</h2>
                <p className="text-muted-foreground">
                    A página que você está procurando não existe ou foi removida.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition-colors"
                >
                    Voltar ao Início
                </Link>
            </div>
        </div>
    )
}
