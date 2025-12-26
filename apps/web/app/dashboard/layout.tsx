"use client"

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, User, BarChart3, Settings, LogOut, Ticket, MapPin, Smartphone, Calendar, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppConfig as Config } from "../AppConfig";

const sidebarGroups = [
    {
        title: "Principal",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        ]
    },
    {
        title: "Cadastros",
        items: [
            { icon: Users, label: "Cambistas", href: "/dashboard/cambistas" },
            { icon: User, label: "Usuários", href: "/dashboard/users" },
            { icon: Wallet, label: "Cobradores", href: "/dashboard/cobradores" },
        ]
    },
    {
        title: "Gestão",
        items: [
            { icon: Smartphone, label: "Gestão de POS", href: "/dashboard/pos" },
            { icon: MapPin, label: "Gestão de Praças", href: "/dashboard/areas" },
        ]
    },
    {
        title: "Operacional",
        items: [
            { icon: Ticket, label: "Jogos / Vendas", href: "/dashboard/games" },
            { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
        ]
    },
    {
        title: "Configurações",
        items: [
            { icon: Settings, label: "Jogos / Preços", href: "/dashboard/settings/games" },
            { icon: Calendar, label: "Sorteios", href: "/dashboard/settings/draws" },
        ]
    },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Find current page title for header
    const allItems = sidebarGroups.flatMap(g => g.items);
    const currentPage = allItems.find(i => i.href === pathname);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed h-full z-20 shadow-xl border-r border-sidebar-border overflow-y-auto">
                <div className="p-6 border-b border-sidebar-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">{Config.name}</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-6">
                    {sidebarGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                            {group.title !== "Principal" && (
                                <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                }`}>
                                                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"}`} />
                                                <span className="font-medium text-sm">{item.label}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-sidebar-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-sidebar-accent gap-3 mb-2"
                        onClick={() => window.location.href = "/"}
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </Button>
                    <div className="text-xs text-muted-foreground text-center">
                        v{Config.version}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-foreground">
                        {currentPage?.label || "Dashboard"}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Sistema Online
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
