"use client"

import { API_URL } from "@/lib/api"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, User, ArrowRight, Loader2, ShieldCheck, Zap, TrendingUp, Shield, Eye, EyeOff } from "lucide-react"
import { AppConfig } from "./AppConfig"
import { useAlert } from "@/context/alert-context"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [mfaRequired, setMfaRequired] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex min-h-screen relative">
      {/* Logo no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-50">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-48 w-auto drop-shadow-2xl"
        />
      </div>

      {/* Left Side - Brand & Features (Gradient Green) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#00A868] via-[#006B4A] to-[#0A1F1C] p-12 flex-col justify-between relative overflow-hidden text-white">


        {/* Main Content */}
        <div className="relative z-10 space-y-6 mt-52">
          <h1 className="text-6xl font-extrabold leading-tight tracking-tight">
            InnoBet Core <br />
            System
          </h1>
          <p className="text-emerald-50 text-xl font-medium max-w-md">
            Tecnologia de alta performance, segurança robusta e inteligência dados para elevar o nível da sua operação.
          </p>

          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Segurança Avançada</p>
                <p className="text-emerald-50/80 text-sm">Autenticação 2FA e criptografia de ponta</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Relatórios em Tempo Real</p>
                <p className="text-emerald-50/80 text-sm">Acompanhe vendas e resultados instantaneamente</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Performance Otimizada</p>
                <p className="text-emerald-50/80 text-sm">Interface rápida e responsiva</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-emerald-50/60 font-mono text-sm">
            Versão {AppConfig.version}
          </p>
        </div>
      </div>

      {/* Right Side - Login Form (Gradient Dark) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-[#020617] via-[#0F172A] to-[#1E293B]">
        <div className="w-full max-w-md">
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden mb-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#00A868] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">InnoBet Core</h2>
          </div>

          <Card className="border-none shadow-2xl bg-[#0F172A] text-white overflow-hidden">
            <CardHeader className="space-y-1 pb-6 pt-8 px-8">
              <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-slate-400">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-5">
                {!mfaRequired ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-slate-300">Usuário</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-[#00A868] transition-colors" />
                        <Input
                          id="username"
                          placeholder="Digite seu usuário"
                          className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-[#00A868] focus:ring-[#00A868] transition-all"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Senha</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-[#00A868] transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          className="pl-10 pr-10 h-12 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-[#00A868] focus:ring-[#00A868] transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 py-2 animate-in slide-in-from-right duration-300">
                    <div className="p-4 bg-[#00A868]/10 border border-[#00A868]/20 rounded-lg flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#00A868] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-100">
                          Autenticação de Dois Fatores
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">
                          Insira o código de 6 dígitos do seu app
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mfa" className="text-slate-300">Código de Verificação</Label>
                      <Input
                        id="mfa"
                        placeholder="000000"
                        className="text-center text-2xl tracking-[0.5em] font-bold h-14 bg-slate-800/50 border-slate-700 text-slate-100 focus:border-[#00A868]"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        maxLength={6}
                        autoFocus
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMfaRequired(false)}
                      className="text-xs w-full text-slate-400 hover:text-white"
                    >
                      ← Voltar para senha
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#00A868] hover:bg-[#008f58] text-white font-bold text-md shadow-lg shadow-emerald-900/20 transition-all duration-200 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      {mfaRequired ? 'Verificar e Entrar' : 'Entrar no Sistema'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  Ao entrar, você concorda com nossos termos de uso
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Problemas para acessar?{" "}
              <a href="#" className="text-[#00A868] hover:underline font-medium">
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>
      {/* Developer Branding */}
      <div className="fixed bottom-2 right-4 z-50 pointer-events-none select-none">
        <span className="text-[10px] font-bold text-slate-500/40 tracking-widest uppercase">Innovare Code</span>
      </div>
    </div>
  )
}
