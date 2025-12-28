"use client"

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, User, BarChart3, Settings, LogOut, Ticket, MapPin, Smartphone, Calendar, Wallet, Menu, Search, ShieldAlert, XCircle, Megaphone, History, TrendingUp, ShieldCheck } from "lucide-react";
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
            { icon: ShieldAlert, label: "Gestão de Risco", href: "/dashboard/risk" },
            { icon: XCircle, label: "Cancelamentos", href: "/dashboard/cancellations" },
            { icon: Ticket, label: "Jogos / Vendas", href: "/dashboard/games" },
            { icon: Search, label: "Consultar Bilhete", href: "/dashboard/consultar-bilhete" },
            { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
            { icon: TrendingUp, label: "Inteligência (BI)", href: "/dashboard/analytics" },
            { icon: Megaphone, label: "Avisos Globais", href: "/dashboard/announcements" },
            { icon: ShieldAlert, label: "Security Center", href: "/dashboard/security" },
        ]
    },
    {
        title: "Configurações",
        items: [
            { icon: Settings, label: "Jogos / Preços", href: "/dashboard/settings/games" },
            { icon: Calendar, label: "Sorteios", href: "/dashboard/settings/draws" },
            { icon: History, label: "Logs de Auditoria", href: "/dashboard/audit" },
            { icon: ShieldCheck, label: "Segurança (MFA)", href: "/dashboard/security-mfa" },
        ]
    },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Find current page title for header
    const allItems = sidebarGroups.flatMap(g => g.items);
    const currentPage = allItems.find(i => i.href === pathname);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? "w-20" : "w-64"} bg-sidebar text-sidebar-foreground flex flex-col fixed h-full z-20 shadow-xl border-r border-sidebar-border overflow-y-auto transition-all duration-300 ease-in-out`}>
                <div className={`p-6 border-b border-sidebar-border shrink-0 ${isCollapsed ? "flex justify-center px-0" : ""}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        {!isCollapsed && <span className="font-bold text-xl tracking-tight">{Config.name}</span>}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-6">
                    {sidebarGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                            {group.title !== "Principal" && !isCollapsed && (
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
                                            <div title={isCollapsed ? item.label : ""} className={`flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"} py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                }`}>
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"}`} />
                                                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className={`p-4 border-t border-sidebar-border ${isCollapsed ? "flex flex-col items-center" : ""}`}>
                    <Button
                        variant="ghost"
                        className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} text-muted-foreground hover:text-red-400 hover:bg-sidebar-accent gap-3 mb-2`}
                        onClick={() => window.location.href = "/"}
                        title={isCollapsed ? "Sair" : ""}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && "Sair"}
                    </Button>
                    <div className="text-xs text-muted-foreground text-center">
                        {isCollapsed ? "v" : "v" + Config.version}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isCollapsed ? "ml-20" : "ml-64"} transition-all duration-300 ease-in-out`}>
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-muted"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-semibold text-foreground">
                            {currentPage?.label || "Dashboard"}
                        </h1>
                    </div>
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
