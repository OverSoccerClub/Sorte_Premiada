"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Ticket } from "lucide-react"

const games = [
    {
        id: "2x500",
        name: "2x500",
        description: "Clássico 2x500. Sorteios diários.",
        href: "/dashboard/games/2x500",
        color: "bg-emerald-500",
        status: "Ativo"
    },
    {
        id: "jb",
        name: "Jogo do Bicho",
        description: "Tradicional. Grupo, Dezena, Centena, Milhar.",
        href: "/dashboard/games/jb",
        color: "bg-amber-500",
        status: "Novo"
    }
]

export default function GamesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Relatório por Jogo
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Selecione um jogo para visualizar as vendas e apostas realizadas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                    <Link key={game.id} href={game.href}>
                        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-muted cursor-pointer group">
                            <CardHeader className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${game.color} text-white shadow-lg`}>
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <Badge variant={game.status === "Novo" ? "default" : "secondary"}>
                                        {game.status}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl pt-4 group-hover:text-emerald-500 transition-colors">
                                    {game.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm mb-4">
                                    {game.description}
                                </p>
                                <div className="flex items-center text-sm font-medium text-emerald-500">
                                    Ver Vendas <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
