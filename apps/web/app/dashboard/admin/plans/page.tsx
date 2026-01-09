"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Plus, Pencil, Trash2, Check, X, ShieldCheck, Users, Ticket, Gamepad2, AlertCircle, Smartphone } from "lucide-react";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { plansService, Plan, CreatePlanData } from "@/services/plans.service";

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const router = useRouter();

    const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm<CreatePlanData>();

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await plansService.getAll(true); // Incluir inativos
            setPlans(data);
        } catch (error: any) {
            console.error('Error fetching plans:', error);
            toast.error(error.message || "Erro ao carregar planos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const onSubmit = async (data: CreatePlanData) => {
        console.log('Form submitted with data:', data);

        try {
            // Converter strings numéricas para number
            const payload = {
                ...data,
                price: Number(data.price),
                maxUsers: Number(data.maxUsers),
                maxTicketsPerMonth: Number(data.maxTicketsPerMonth),
                maxGames: Number(data.maxGames),
                maxActiveDevices: Number(data.maxActiveDevices),
            };

            console.log('Payload to send:', payload);

            if (editingPlan) {
                console.log('Updating plan:', editingPlan.id);
                await plansService.update(editingPlan.id, payload);
                toast.success("Plano atualizado com sucesso!");
            } else {
                console.log('Creating new plan');
                await plansService.create(payload);
                toast.success("Plano criado com sucesso!");
            }
            setIsDialogOpen(false);
            fetchPlans();
            reset();
            setEditingPlan(null);
        } catch (error: any) {
            console.error('Error saving plan:', error);
            const errorMessage = error.response?.data?.message || error.message || "Erro ao salvar plano.";
            toast.error(errorMessage);
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setValue("name", plan.name);
        setValue("description", plan.description || "");
        setValue("price", plan.price);
        setValue("maxUsers", plan.maxUsers);
        setValue("maxTicketsPerMonth", plan.maxTicketsPerMonth);
        setValue("maxGames", plan.maxGames);
        setValue("maxActiveDevices", plan.maxActiveDevices);
        setValue("isActive", plan.isActive);
        setValue("isDefault", plan.isDefault);
        setIsDialogOpen(true);
    };

    const handleNew = () => {
        setEditingPlan(null);
        reset({
            isActive: true,
            price: 0,
            maxUsers: 10,
            maxTicketsPerMonth: 1000,
            maxGames: 5,
            maxActiveDevices: 5,
        });
        setIsDialogOpen(true);
    };

    const confirmDelete = (plan: Plan) => {
        setPlanToDelete(plan);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!planToDelete) return;
        try {
            await plansService.delete(planToDelete.id);
            toast.success("Plano removido com sucesso!");
            setIsDeleteDialogOpen(false);
            setPlanToDelete(null);
            fetchPlans();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erro ao remover plano.");
        }
    };

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title="Configuração de Planos"
                description="Gerencie os planos de assinatura e seus limites padrão."
                icon={<ShieldCheck className="w-6 h-6 text-primary" />}
            >
                <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Plano
                </Button>
            </StandardPageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`relative overflow-hidden transition-all ${!plan.isActive ? 'opacity-70 border-dashed' : ''} ${plan.isDefault ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                        {plan.isDefault && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg font-bold">
                                PADRÃO
                            </div>
                        )}

                        <CardHeader className="pb-3">
                            <CardTitle className="flex justify-between items-start">
                                <span>{plan.name}</span>
                                <Badge variant={plan.isActive ? "default" : "secondary"}>
                                    {plan.isActive ? "Ativo" : "Inativo"}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-2xl font-bold text-foreground">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                                <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </CardDescription>
                            {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm">
                                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>Até <strong>{plan.maxUsers}</strong> usuários</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Ticket className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>Até <strong>{plan.maxTicketsPerMonth}</strong> bilhetes/mês</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Gamepad2 className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>Até <strong>{plan.maxGames}</strong> jogos</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Smartphone className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>Até <strong>{plan.maxActiveDevices}</strong> dispositivos ativos</span>
                                </div>
                            </div>

                            <div className="flex gap-2 relative z-10">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(plan)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Editar
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={!!(plan._count?.companies && plan._count.companies > 0)}
                                    onClick={() => confirmDelete(plan)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {plan._count?.companies ? (
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Em uso por {plan._count.companies} empresa(s)
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                        <DialogDescription>
                            Configure os limites e preços deste plano.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name">Nome do Plano</Label>
                                <Input id="name" {...register("name", { required: true })} placeholder="Ex: Plano Ouro" />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description">Descrição (Opcional)</Label>
                                <Textarea id="description" {...register("description")} placeholder="Ex: Ideal para grandes empresas..." />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Preço Mensal (R$)</Label>
                                <Input id="price" type="number" step="0.01" {...register("price", { required: true, min: 0 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxUsers">Máx. Usuários</Label>
                                <Input id="maxUsers" type="number" {...register("maxUsers", { required: true, min: 1 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxTicketsPerMonth">Máx. Bilhetes/Mês</Label>
                                <Input id="maxTicketsPerMonth" type="number" {...register("maxTicketsPerMonth", { required: true, min: 100 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxGames">Máx. Jogos</Label>
                                <Input id="maxGames" type="number" {...register("maxGames", { required: true, min: 1 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxActiveDevices">Máx. Dispositivos Ativos</Label>
                                <Input id="maxActiveDevices" type="number" {...register("maxActiveDevices", { required: true, min: 1 })} />
                            </div>

                            <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Plano Ativo</Label>
                                    <p className="text-sm text-muted-foreground">Se desativado, não aparecerá para novas empresas.</p>
                                </div>
                                <Controller
                                    name="isActive"
                                    control={control}
                                    defaultValue={true}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>

                            <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Definir como Padrão</Label>
                                    <p className="text-sm text-muted-foreground">Novas empresas serão criadas com este plano automaticamente.</p>
                                </div>
                                <Controller
                                    name="isDefault"
                                    control={control}
                                    defaultValue={false}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar Plano</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
