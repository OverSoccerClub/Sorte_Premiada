"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Filter, MoreVertical, Trash2, Edit } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Payment {
    id: string;
    companyId: string;
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
    method: string | null;
    referenceMonth: string;
    dueDate: string;
    paidAt: string | null;
    notes: string | null;
    company: {
        id: string;
        companyName: string;
        licenseStatus: string;
    };
}

export default function PaymentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [markPaidDialog, setMarkPaidDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user?.role !== "MASTER") {
            router.push("/dashboard");
            return;
        }

        fetchPayments();
    }, [user, filter]);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem("token");
            let url = `${AppConfig.api.baseUrl}/payments`;

            if (filter !== "all") {
                url += `?status=${filter}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data);
            }
        } catch (error) {
            toast.error("Erro ao carregar pagamentos");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!selectedPayment) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${AppConfig.api.baseUrl}/payments/${selectedPayment.id}/mark-paid`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        method: paymentMethod,
                        transactionId: transactionId || undefined,
                    }),
                }
            );

            if (response.ok) {
                toast.success("Pagamento marcado como pago!");
                setMarkPaidDialog(false);
                setPaymentMethod("");
                setTransactionId("");
                fetchPayments();
            } else {
                toast.error("Erro ao marcar pagamento");
            }
        } catch (error) {
            toast.error("Erro ao processar");
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelPayment = async (paymentId: string) => {
        if (!confirm("Tem certeza que deseja cancelar este pagamento?")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${AppConfig.api.baseUrl}/payments/${paymentId}/mark-overdue`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                toast.success("Pagamento cancelado!");
                fetchPayments();
            } else {
                toast.error("Erro ao cancelar pagamento");
            }
        } catch (error) {
            toast.error("Erro ao processar");
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm("Tem certeza que deseja EXCLUIR este pagamento? Esta ação não pode ser desfeita!")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${AppConfig.api.baseUrl}/payments/${paymentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                toast.success("Pagamento excluído!");
                fetchPayments();
            } else {
                toast.error("Erro ao excluir pagamento");
            }
        } catch (error) {
            toast.error("Erro ao processar");
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            PENDING: { variant: "outline", icon: Clock, label: "Pendente" },
            PAID: { variant: "default", icon: CheckCircle, label: "Pago" },
            OVERDUE: { variant: "destructive", icon: AlertTriangle, label: "Atrasado" },
            CANCELLED: { variant: "secondary", icon: XCircle, label: "Cancelado" },
            REFUNDED: { variant: "secondary", icon: XCircle, label: "Reembolsado" },
        };

        const config = variants[status] || variants.PENDING;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-BR");
    };

    const isOverdue = (payment: Payment) => {
        if (payment.status !== "PENDING") return false;
        return new Date(payment.dueDate) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredPayments = payments;

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title="Gestão de Pagamentos"
                description="Controle de pagamentos de mensalidades das empresas"
                icon={DollarSign}
            />

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="w-64">
                            <Label>Status</Label>
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="PENDING">Pendentes</SelectItem>
                                    <SelectItem value="PAID">Pagos</SelectItem>
                                    <SelectItem value="OVERDUE">Atrasados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Pagamentos */}
            <Card>
                <CardHeader>
                    <CardTitle>Pagamentos ({filteredPayments.length})</CardTitle>
                    <CardDescription>
                        Lista de todos os pagamentos de mensalidades
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Pago em</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment) => (
                                <TableRow key={payment.id} className={isOverdue(payment) ? "bg-red-50" : ""}>
                                    <TableCell className="font-medium">
                                        {payment.company.companyName}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                    <TableCell>
                                        <span className={isOverdue(payment) ? "text-red-600 font-semibold" : ""}>
                                            {formatDate(payment.dueDate)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {payment.paidAt ? formatDate(payment.paidAt) : "-"}
                                    </TableCell>
                                    <TableCell>{payment.method || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {payment.status === "PENDING" || payment.status === "OVERDUE" ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setMarkPaidDialog(true);
                                                        }}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Marcar Pago
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleCancelPayment(payment.id)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Cancelar
                                                    </Button>
                                                </>
                                            ) : payment.status === "PAID" ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeletePayment(payment.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Excluir
                                                </Button>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredPayments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        Nenhum pagamento encontrado
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog: Marcar como Pago */}
            <Dialog open={markPaidDialog} onOpenChange={setMarkPaidDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Marcar Pagamento como Pago</DialogTitle>
                        <DialogDescription>
                            Empresa: {selectedPayment?.company.companyName}
                            <br />
                            Valor: {selectedPayment && formatCurrency(selectedPayment.amount)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Método de Pagamento *</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PIX">PIX</SelectItem>
                                    <SelectItem value="BOLETO">Boleto</SelectItem>
                                    <SelectItem value="CARTAO">Cartão</SelectItem>
                                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>ID da Transação (opcional)</Label>
                            <Input
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="Ex: ABC123..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMarkPaidDialog(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleMarkAsPaid}
                            disabled={!paymentMethod || processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirmar Pagamento
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
