"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldAlert, Key, Clipboard, Loader2, RefreshCw, Smartphone, CheckCircle2 } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function SecuritySettingsPage() {
    const [mfaEnabled, setMfaEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify'>('idle')
    const [qrData, setQrData] = useState<{ secret: string, qrCodeDataUrl: string } | null>(null)
    const [otpCode, setOtpCode] = useState("")
    const [verifying, setVerifying] = useState(false)
    const { showAlert } = useAlert()

    useEffect(() => {
        const userStr = localStorage.getItem("user")
        if (userStr) {
            const user = JSON.parse(userStr)
            setMfaEnabled(user.twoFactorEnabled)
        }
        setLoading(false)
    }, [])

    const startSetup = async () => {
        setVerifying(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/auth/mfa/generate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setQrData(data)
                setSetupStep('qr')
            }
        } catch (error) {
            showAlert("Erro", "Não foi possível iniciar setup do MFA.", "error")
        } finally {
            setVerifying(false)
        }
    }

    const verifyAndEnable = async () => {
        if (otpCode.length !== 6) return
        setVerifying(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/auth/mfa/enable`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ secret: qrData?.secret, code: otpCode })
            })

            if (res.ok) {
                setMfaEnabled(true)
                setSetupStep('idle')
                setQrData(null)
                setOtpCode("")

                // Update local storage
                const user = JSON.parse(localStorage.getItem("user") || "{}")
                user.twoFactorEnabled = true
                localStorage.setItem("user", JSON.stringify(user))

                showAlert("Sucesso", "Autenticação de Dois Fatores ativada com sucesso!", "success")
            } else {
                showAlert("Erro", "Código inválido. Tente novamente.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Falha ao verificar código.", "error")
        } finally {
            setVerifying(false)
        }
    }

    const disableMfa = async () => {
        if (!confirm("Deseja realmente desativar o MFA? Sua conta ficará menos protegida.")) return
        setVerifying(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/auth/mfa/disable`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setMfaEnabled(false)
                const user = JSON.parse(localStorage.getItem("user") || "{}")
                user.twoFactorEnabled = false
                localStorage.setItem("user", JSON.stringify(user))
                showAlert("Aviso", "MFA desativado.", "warning")
            }
        } catch (error) {
            showAlert("Erro", "Falha ao desativar MFA.", "error")
        } finally {
            setVerifying(false)
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Key className="w-8 h-8 text-blue-500" />
                        Segurança & MFA
                    </h2>
                    <p className="text-muted-foreground mt-1">Proteja sua conta administrativa com autenticação de dois fatores.</p>
                </div>
                {mfaEnabled && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 px-3 py-1 text-sm">
                        <ShieldCheck className="w-4 h-4" /> ATIVO
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-border shadow-md overflow-hidden bg-card">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-500" />
                            Autenticador de Dois Fatores (TOTP)
                        </CardTitle>
                        <CardDescription>Use aplicativos como Google Authenticator ou Authy.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        {!mfaEnabled && setupStep === 'idle' && (
                            <div className="text-center space-y-6 py-4">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <ShieldAlert className="w-10 h-10 text-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">Sua conta está desprotegida</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        Adicione uma camada extra de segurança para evitar acessos não autorizados ao painel administrativo.
                                    </p>
                                </div>
                                <Button size="lg" onClick={startSetup} disabled={verifying} className="bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-md">
                                    {verifying ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 w-5 h-5" />}
                                    Ativar MFA Agora
                                </Button>
                            </div>
                        )}

                        {setupStep === 'qr' && qrData && (
                            <div className="flex flex-col md:flex-row gap-8 items-center animate-in zoom-in-95 duration-300">
                                <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-200">
                                    <img src={qrData.qrCodeDataUrl} alt="QR Code MFA" className="w-[180px] h-[180px]" />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-foreground">Passo 1: Escanear QR Code</h4>
                                        <p className="text-sm text-muted-foreground">Abra seu aplicativo de autenticação e escaneie o código acima.</p>
                                    </div>
                                    <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono break-all border border-border">
                                        <span className="text-muted-foreground uppercase">Key:</span> {qrData.secret}
                                    </div>
                                    <div className="space-y-1 pt-2">
                                        <h4 className="font-bold text-foreground">Passo 2: Digite o Código</h4>
                                        <p className="text-sm text-muted-foreground">Insira o código de 6 dígitos gerado pelo aplicativo.</p>
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                placeholder="000 000"
                                                className="text-center text-xl tracking-[0.5em] font-bold h-12"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                            />
                                            <Button onClick={verifyAndEnable} disabled={verifying || otpCode.length < 6} className="h-12 bg-emerald-600 hover:bg-emerald-700">
                                                {verifying ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                                            </Button>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSetupStep('idle')} className="text-muted-foreground">Cancelar</Button>
                                </div>
                            </div>
                        )}

                        {mfaEnabled && (
                            <div className="flex flex-col items-center py-6 gap-6">
                                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
                                    <ShieldCheck className="w-12 h-12 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-foreground">Proteção Ativada</h3>
                                    <p className="text-muted-foreground mt-1">Sua conta está blindada com criptografia TOTP.</p>
                                </div>
                                <div className="w-full max-w-sm p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex gap-3">
                                    <ShieldAlert className="w-10 h-10 shrink-0 text-emerald-400" />
                                    <span>Agora, sempre que você fizer login, solicitaremos o código gerado no seu celular. Não perca acesso ao seu app autenticador.</span>
                                </div>
                                <Button variant="outline" onClick={disableMfa} disabled={verifying} className="text-red-500 border-red-200 hover:bg-red-50 font-bold">
                                    {verifying ? <Loader2 className="animate-spin mr-2" /> : <ShieldAlert className="mr-2 w-4 h-4" />}
                                    Desativar MFA
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-border shadow-sm bg-slate-900 text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Dicas de Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs opacity-90">
                            <p>O MFA é obrigatório para manter o selo de Conformidade Corporativa.</p>
                            <p>Recomendamos o uso do <strong>Bitwarden</strong> ou <strong>Authy</strong> para gerenciar seus segredos.</p>
                            <p>Nunca compartilhe seu QR Code ou chave secreta com ninguém, nem mesmo suporte técnico.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Clipboard className="w-4 h-4 text-blue-500" /> Atividade Recente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] border-b border-border pb-2">
                                <span className="text-muted-foreground italic">Login bem sucedido</span>
                                <span className="font-mono">IP: 187.xx.xx.xx</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-muted-foreground italic">MFA verificada</span>
                                <span className="font-mono">Hoje, 09:30</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
