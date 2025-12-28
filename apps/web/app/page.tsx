"use client"

import { API_URL } from "@/lib/api"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, User, ArrowRight, Loader2 } from "lucide-react"
import { AppConfig } from "./AppConfig"
import { useAlert } from "@/context/alert-context"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [mfaRequired, setMfaRequired] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showAlert } = useAlert()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, twoFactorCode }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.mfa_required) {
          setMfaRequired(true)
          setLoading(false)
          return
        }
        localStorage.setItem("token", data.access_token)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        showAlert("Login Falhou", data.message || "Verifique suas credenciais e tente novamente.", "error")
      }
    } catch (error) {
      console.error("Erro ao fazer login", error)
      showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <Card className="w-[400px] border-slate-700 bg-slate-800/50 backdrop-blur-xl text-slate-100 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{AppConfig.name}</CardTitle>
          <CardDescription className="text-slate-400">
            Entre com suas credenciais para gerenciar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {!mfaRequired ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-200">Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="username"
                      placeholder="admin"
                      className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-2 animate-in slide-in-from-right duration-300">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <p className="text-xs text-emerald-200">Segurança Ativada: Insira o código de 6 dígitos do seu autenticador.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mfa" className="text-slate-200">Código de Autenticação</Label>
                  <Input
                    id="mfa"
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] font-bold h-14 bg-slate-900/50 border-slate-700 text-slate-100 focus:border-emerald-500"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
                <Button variant="ghost" onClick={() => setMfaRequired(false)} className="text-slate-400 text-xs w-full">
                  Voltar para senha
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-6 shadow-lg shadow-emerald-900/20 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mfaRequired ? 'Verificar e Entrar' : 'Entrar no Sistema'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">
              Versão {AppConfig.version}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
