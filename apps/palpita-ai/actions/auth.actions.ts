'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSession, clearSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/types'

const registerSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos (apenas números)'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
})

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
})

export async function registerAction(
    _prevState: ActionResult,
    formData: FormData
): Promise<ActionResult> {
    const raw = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        cpf: formData.get('cpf') as string,
        phone: formData.get('phone') as string,
        password: formData.get('password') as string,
        confirmPassword: formData.get('confirmPassword') as string,
    }

    const parsed = registerSchema.safeParse(raw)
    if (!parsed.success) {
        const issue = parsed.error.issues?.[0]
        return { success: false, error: issue?.message ?? 'Dados inválidos' }
    }

    const { name, email, cpf, phone, password } = parsed.data

    try {
        const existing = await db.palpitaUser.findFirst({
            where: { OR: [{ email }, { cpf }] },
        })

        if (existing) {
            return {
                success: false,
                error: existing.email === email ? 'Email já cadastrado' : 'CPF já cadastrado',
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await db.palpitaUser.create({
            data: { name, email, cpf, phone: phone || null, password: hashedPassword },
        })

        await setSession({ id: user.id, name: user.name, email: user.email })
    } catch (err) {
        console.error('[registerAction] error:', err)
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' }
    }

    redirect('/apostar')
}

export async function loginAction(
    _prevState: ActionResult,
    formData: FormData
): Promise<ActionResult> {
    const raw = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const parsed = loginSchema.safeParse(raw)
    if (!parsed.success) {
        const issue = parsed.error.issues?.[0]
        return { success: false, error: issue?.message ?? 'Dados inválidos' }
    }

    const { email, password } = parsed.data

    try {
        const user = await db.palpitaUser.findUnique({ where: { email } })
        if (!user) {
            return { success: false, error: 'Email ou senha incorretos' }
        }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
            return { success: false, error: 'Email ou senha incorretos' }
        }

        await setSession({ id: user.id, name: user.name, email: user.email })
    } catch (err) {
        console.error('[loginAction] error:', err)
        return { success: false, error: 'Erro ao fazer login. Tente novamente.' }
    }

    redirect('/apostar')
}

export async function logoutAction(): Promise<void> {
    await clearSession()
    redirect('/login')
}
