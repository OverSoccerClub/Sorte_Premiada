# MegaSena System

Sistema completo de gestão de loterias (Web, Mobile e API).

## Estrutura do Monorepo

- **apps/api**: Backend NestJS + Prisma.
- **apps/web**: Painel Admin Next.js + Shadcn/UI.
- **apps/mobile**: App Cambista React Native (Expo).
- **packages/database**: Schema Prisma e cliente compartilhado.
- **packages/types**: Tipos TypeScript compartilhados.

## Configuração Inicial

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Banco de Dados**:
   Certifique-se que o PostgreSQL está rodando e configure o `.env` em `packages/database`.
   ```bash
   cd packages/database
   npx prisma db push
   npx prisma db seed
   ```

3. **Executar Projetos**:
   Você pode rodar tudo junto (se configurado no turbo) ou individualmente em terminais separados.

   - **API**: `cd apps/api && npm run start:dev`
   - **Web**: `cd apps/web && npm run dev`
   - **Mobile**: `cd apps/mobile && npx expo start`

## Deploy

- **API/Web**: Podem ser deployados na Vercel (Web) e Render/Railway (API), ou ambos em um VPS com Docker.
- **Mobile**: Build via EAS Build (`eas build`) para gerar APK/IPA.
