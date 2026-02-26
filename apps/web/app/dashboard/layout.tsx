"use client"

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, User, BarChart3, Settings, LogOut, Ticket, MapPin, Smartphone, Calendar, Wallet, Menu, Search, ShieldAlert, XCircle, Megaphone, History, TrendingUp, ShieldCheck, Trophy, Building2, FileCheck, Receipt, Layers, Bug, DollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppConfig as Config } from "../AppConfig";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { CompanyIndicator } from "@/components/company-indicator";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { SessionTimer } from "@/components/session-timer";

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
            { icon: Wallet, label: "Cobradores", href: "/dashboard/cobradores" },
            { icon: User, label: "Usuários (Admin)", href: "/dashboard/users" },
            { icon: Smartphone, label: "Dispositivos POS", href: "/dashboard/pos" },
            { icon: MapPin, label: "Praças", href: "/dashboard/areas" },
        ]
    },
    {
        title: "Vendas & Operação",
        items: [
            { icon: Ticket, label: "Gestão de Jogos", href: "/dashboard/games" },
            { icon: Calendar, label: "Gestão de Sorteios", href: "/dashboard/draws" },
            { icon: Search, label: "Consultar Bilhete", href: "/dashboard/consultar-bilhete" },
            // { icon: QrCode, label: "Validação", href: "/dashboard/validate" }, // Future
        ]
    },
    {
        title: "Gestão de Apostas",
        items: [
            { icon: XCircle, label: "Cancelamentos", href: "/dashboard/cancellations" },
            { icon: ShieldAlert, label: "Gestão de Risco", href: "/dashboard/risk" },
            { icon: Trophy, label: "Segunda Chance", href: "/dashboard/second-chance" },
        ]
    },
    {
        title: "Relatórios & Financeiro",
        items: [
            { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
            { icon: TrendingUp, label: "Inteligência (BI)", href: "/dashboard/analytics" },
            { icon: Wallet, label: "Prestação de Contas", href: "/dashboard/prestacao-contas" },
        ]
    },
    {
        title: "Configurações",
        items: [
            { icon: Building2, label: "Empresa", href: "/dashboard/settings/company" },
            { icon: Megaphone, label: "Avisos Globais", href: "/dashboard/announcements" },
            { icon: ShieldCheck, label: "Segurança (MFA)", href: "/dashboard/security-mfa" },
            { icon: History, label: "Logs de Auditoria", href: "/dashboard/audit" },
        ]
    },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { settings, loading: companyLoading } = useCompany(); // Renamed to companyLoading to avoid conflict
    const { user, loading: authLoading } = useAuth(); // Import auth context
    const { hasPermission } = usePermissions();

    const sidebarGroups = [
        {
            title: "Principal",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
                ...(user?.role === 'MASTER' ? [
                    { icon: ShieldCheck, label: "Admin Global", href: "/dashboard/admin" },
                    { icon: Bug, label: "Bugs & Correções", href: "/dashboard/bugs" },
                ] : []),
            ]
        },
        {
            title: "Cadastros",
            items: [
                { icon: Users, label: "Cambistas", href: "/dashboard/cambistas" },
                { icon: Wallet, label: "Cobradores", href: "/dashboard/cobradores" },
                { icon: User, label: "Usuários (Admin)", href: "/dashboard/users" },
                { icon: Smartphone, label: "Dispositivos POS", href: "/dashboard/pos" },
                { icon: MapPin, label: "Praças", href: "/dashboard/areas" },
            ]
        },
        {
            title: "Vendas & Operação",
            items: [
                { icon: Trophy, label: "Palpita Ai (Apostar)", href: "/dashboard/games/paipita-ai" },
                { icon: Ticket, label: "Gestão de Jogos", href: "/dashboard/games" },
                { icon: Calendar, label: "Gestão de Sorteios", href: "/dashboard/draws" },
                { icon: Calendar, label: "Sorteio Minuto da Sorte", href: "/dashboard/admin/minuto-sorte" },
                ...(hasPermission(PERMISSIONS.VIEW_SALES_REPORT) ? [{ icon: Trophy, label: "Relatório Palpita Ai", href: "/dashboard/games/palpita" }] : []),
                ...(hasPermission(PERMISSIONS.VIEW_PALPITA) ? [{ icon: Trophy, label: "Gestão Palpita Ai", href: "/dashboard/palpita" }] : []),
                { icon: Search, label: "Consultar Bilhete", href: "/dashboard/consultar-bilhete" },
                // { icon: QrCode, label: "Validação", href: "/dashboard/validate" }, // Future
            ]
        },
        {
            title: "Gestão de Apostas",
            items: [
                { icon: XCircle, label: "Cancelamentos", href: "/dashboard/cancellations" },
                { icon: ShieldAlert, label: "Gestão de Risco", href: "/dashboard/risk" },
                { icon: Trophy, label: "Segunda Chance", href: "/dashboard/second-chance" },
            ]
        },
        ...(user?.role === 'MASTER' ? [{
            title: "Licenciamento & Admin",
            items: [
                { icon: ShieldCheck, label: "Admin Global", href: "/dashboard/admin" },
                { icon: Layers, label: "Configurar Planos", href: "/dashboard/admin/plans" },
                { icon: FileCheck, label: "Gestão de Licenças", href: "/dashboard/licenses" },
                { icon: DollarSign, label: "Pagamentos", href: "/dashboard/payments" },
                { icon: Receipt, label: "Financeiro Global", href: "/dashboard/billing" },
                { icon: Sparkles, label: "Simulador de Sorteio", href: "/dashboard/simulator" },
            ]
        }] : []),
        {
            title: "Relatórios & Financeiro",
            items: [
                { icon: BarChart3, label: "Visão Financeira", href: "/dashboard/finance/overview" },
                { icon: TrendingUp, label: "Inteligência (BI)", href: "/dashboard/analytics" },
                { icon: Wallet, label: "Prestação de Contas", href: "/dashboard/prestacao-contas" },
                { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
            ]
        },
        {
            title: "Configurações",
            items: [
                { icon: Building2, label: "Empresa", href: "/dashboard/settings/company" },
                { icon: Megaphone, label: "Avisos Globais", href: "/dashboard/announcements" },
                { icon: ShieldCheck, label: "Segurança (MFA)", href: "/dashboard/security-mfa" },
                { icon: History, label: "Logs de Auditoria", href: "/dashboard/audit" },
            ]
        },
    ];

    // Find current page title for header
    const allItems = sidebarGroups.flatMap(g => g.items);
    const currentPage = allItems.find(i => i.href === pathname);
    const loading = companyLoading || authLoading;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? "w-20" : "w-64"} bg-sidebar text-sidebar-foreground flex flex-col fixed h-full z-20 shadow-xl border-r border-sidebar-border transition-all duration-300 ease-in-out`}>

                {/* Fixed Header */}
                <div className={`p-6 border-b border-sidebar-border shrink-0 ${isCollapsed ? "flex justify-center px-0" : ""}`}>
                    <div className="flex items-center gap-3">
                        {settings.logoUrl ? (
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                                <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                        )}
                        {!isCollapsed && <span className="font-bold text-xl tracking-tight">{loading ? "..." : settings.companyName}</span>}
                    </div>
                </div>

                {/* Company Indicator */}
                {!isCollapsed && (
                    <div className="px-4 pt-4">
                        <CompanyIndicator />
                    </div>
                )}

                {/* Scrollable Navigation */}
                <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 space-y-6">
                    {sidebarGroups.map((group) => (
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

                {/* Fixed Footer (Logout) */}
                <div className={`p-4 border-t border-sidebar-border shrink-0 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
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
                        {/* Indicador da Empresa Atual (para todos os usuários) */}
                        {!companyLoading && settings.companyName && user?.role !== 'MASTER' && (
                            <div className="flex items-center gap-2 text-sm text-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium">{settings.companyName}</span>
                            </div>
                        )}

                        {/* Session Timer */}
                        <SessionTimer />

                        {/* User Indicator */}
                        {user && (
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-semibold leading-none text-foreground">{user.name || user.username}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{user.role}</div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase ring-1 ring-emerald-500/20">
                                    {(user.name || user.username).substring(0, 2)}
                                </div>
                            </div>
                        )}

                        {/* TenantSwitcher (apenas para MASTER) */}
                        <TenantSwitcher />

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

            {/* Developer Branding */}
            <div className="fixed bottom-2 right-4 z-50 pointer-events-none select-none">
                <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase">Innovare Code</span>
            </div>
        </div>
    );
}
