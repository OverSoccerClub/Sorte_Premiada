# Guia de Uso: Sistema Multi-Tenant

## 📋 Visão Geral

Este guia explica como usar o sistema multi-tenant após a implementação completa. O sistema agora suporta múltiplas empresas com isolamento total de dados.

---

## 👥 Tipos de Usuários

### 1. MASTER (Super Administrador)
- **Acesso**: Todas as empresas
- **Poderes**:
  - Criar novas empresas
  - Visualizar e gerenciar qualquer empresa
  - Trocar entre empresas usando o TenantSwitcher
  - Acessar dashboard global de administração

### 2. ADMIN (Administrador da Empresa)
- **Acesso**: Apenas sua própria empresa
- **Poderes**:
  - Gerenciar configurações da empresa
  - Criar/editar jogos e sorteios
  - Gerenciar usuários (cambistas, cobradores)
  - Ver relatórios da empresa

### 3. CAMBISTA (Vendedor)
- **Acesso**: Apenas sua própria empresa
- **Poderes**:
  - Criar bilhetes
  - Ver seus próprios bilhetes
  - Ver relatórios pessoais

### 4. COBRADOR (Coletor)
- **Acesso**: Apenas sua própria empresa
- **Poderes**:
  - Coletar pagamentos
  - Ver transações da sua área

---

## 🚀 Como Criar uma Nova Empresa (MASTER)

### Via API

```bash
POST http://localhost:3001/company
Authorization: Bearer <master-token>
Content-Type: application/json

{
  "slug": "loteria-norte",
  "companyName": "Loteria do Norte",
  "slogan": "Sua sorte está aqui!",
  "primaryColor": "#1E40AF",
  "adminName": "João Silva",
  "adminUsername": "joao.admin",
  "adminPassword": "senha-segura-123"
}
```

### Campos Obrigatórios:
- `slug`: Identificador único (usado para white-label)
- `companyName`: Nome da empresa
- `adminName`: Nome do primeiro administrador
- `adminUsername`: Username do admin
- `adminPassword`: Senha do admin (será hasheada)

### Campos Opcionais:
- `slogan`: Slogan da empresa
- `primaryColor`: Cor primária (hex)
- `logoUrl`: URL do logo
- `phone`: Telefone
- `whatsapp`: WhatsApp
- `email`: Email
- `updateUrl`: URL do repositório para auto-update

### Resposta:
```json
{
  "company": {
    "id": "uuid-da-empresa",
    "slug": "loteria-norte",
    "companyName": "Loteria do Norte",
    ...
  },
  "adminUser": {
    "id": "uuid-do-admin",
    "username": "joao.admin",
    "role": "ADMIN",
    "companyId": "uuid-da-empresa"
  }
}
```

---

## 🔄 Como Trocar de Empresa (MASTER)

### No Dashboard Web

1. **Login como MASTER**
2. **Localize o TenantSwitcher** no header (canto superior direito)
3. **Clique no dropdown** que mostra a empresa atual
4. **Selecione a empresa** desejada
5. **Todo o dashboard será atualizado** com dados da nova empresa

### Visualmente:

```
┌─────────────────────────────────────────────────────┐
│  Dashboard                    [Empresa: ▼]  Online  │
│                               └─────────────┘        │
│                                     ↓                │
│                         ┌──────────────────────┐    │
│                         │ Loteria do Norte     │    │
│                         │ Sorte do Sul         │    │
│                         │ A Perseverança       │    │
│                         └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Via API

Adicione `?targetCompanyId=<uuid>` em qualquer endpoint:

```bash
GET http://localhost:3001/tickets?targetCompanyId=uuid-da-empresa
Authorization: Bearer <master-token>
```

---

## 🎨 White-Label: Como Configurar

### 1. Configurações Básicas

Acesse: **Dashboard → Configurações → Empresa**

Campos disponíveis:
- Nome da Empresa
- Slogan
- Logo (upload de imagem)
- Cor Primária
- Telefone
- WhatsApp
- Email
- URL de Atualização (para mobile)

### 2. Logo

**Recomendações**:
- Formato: PNG com fundo transparente
- Tamanho: 512x512px
- Peso máximo: 500KB

**Como fazer upload**:
```bash
POST http://localhost:3001/company/settings
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

{
  "logo": <arquivo>
}
```

### 3. Cores

**Formato**: Hexadecimal (#RRGGBB)

**Exemplos**:
- Azul: `#1E40AF`
- Verde: `#10B981`
- Vermelho: `#EF4444`
- Roxo: `#8B5CF6`

### 4. Aplicação Automática

Após salvar as configurações:
- ✅ Web: Atualiza automaticamente
- ✅ Mobile: Atualiza no próximo login

---

## 📱 Mobile: Configuração por Empresa

### Como o Mobile Identifica a Empresa

O aplicativo mobile usa o **slug da empresa** para carregar as configurações corretas.

### Opção 1: Configuração Manual

Edite `apps/mobile/constants/AppConfig.ts`:

```typescript
export const AppConfig = {
  companySlug: 'loteria-norte', // ← Slug da empresa
  apiUrl: 'http://api.exemplo.com',
  // ...
}
```

### Opção 2: Build por Empresa

Crie builds separados para cada empresa:

```bash
# Empresa 1
COMPANY_SLUG=loteria-norte npm run build:android

# Empresa 2
COMPANY_SLUG=sorte-sul npm run build:android
```

### Opção 3: Seleção na Tela de Login

Adicione um seletor de empresa na tela de login:

```typescript
// Buscar empresas disponíveis
GET /company/settings?slug=<slug-digitado>

// Ou listar todas (público)
GET /company/all-public
```

---

## 🔒 Segurança: Boas Práticas

### Para MASTER

1. **Nunca compartilhe credenciais MASTER**
2. **Use senhas fortes** (mínimo 12 caracteres)
3. **Ative MFA** (autenticação de dois fatores)
4. **Revise logs regularmente** em Dashboard → Logs de Auditoria

### Para ADMIN

1. **Não tente acessar outras empresas** (será bloqueado)
2. **Crie usuários com permissões mínimas necessárias**
3. **Revise cancelamentos suspeitos**
4. **Monitore gestão de risco**

### Para Todos

1. **Logout ao sair** do sistema
2. **Não use computadores públicos**
3. **Verifique a empresa atual** antes de criar bilhetes
4. **Reporte atividades suspeitas**

---

## 📊 Relatórios por Empresa

### Relatórios Disponíveis

Todos os relatórios são **automaticamente filtrados** pela empresa do usuário:

- ✅ Relatório de Vendas
- ✅ Relatório de Comissões
- ✅ Relatório de Cancelamentos
- ✅ Relatório Financeiro
- ✅ Relatório de Áreas
- ✅ Relatório de Cambistas

### MASTER: Relatórios Globais

Para ver relatórios de todas as empresas:

1. **Não selecione nenhuma empresa** no TenantSwitcher
2. **Acesse o relatório desejado**
3. **Dados de todas as empresas** serão exibidos

Para relatório de uma empresa específica:

1. **Selecione a empresa** no TenantSwitcher
2. **Acesse o relatório**
3. **Apenas dados daquela empresa** serão exibidos

---

## 🧪 Testando o Isolamento de Dados

### Teste 1: Criar Empresas de Teste

```bash
# Empresa A
POST /company
{
  "slug": "empresa-a",
  "companyName": "Empresa A",
  "adminUsername": "admin.a",
  "adminPassword": "senha123"
}

# Empresa B
POST /company
{
  "slug": "empresa-b",
  "companyName": "Empresa B",
  "adminUsername": "admin.b",
  "adminPassword": "senha123"
}
```

### Teste 2: Criar Dados em Cada Empresa

```bash
# Login como Admin A
POST /auth/login
{ "username": "admin.a", "password": "senha123" }

# Criar bilhete na Empresa A
POST /tickets
{ "numbers": [1, 2, 3, 4, 5], "gameId": "..." }

# Login como Admin B
POST /auth/login
{ "username": "admin.b", "password": "senha123" }

# Criar bilhete na Empresa B
POST /tickets
{ "numbers": [6, 7, 8, 9, 10], "gameId": "..." }
```

### Teste 3: Verificar Isolamento

```bash
# Como Admin A, buscar bilhetes
GET /tickets
# Deve retornar APENAS bilhetes da Empresa A

# Como Admin B, buscar bilhetes
GET /tickets
# Deve retornar APENAS bilhetes da Empresa B

# Como MASTER, buscar bilhetes
GET /tickets
# Deve retornar bilhetes de TODAS as empresas

# Como MASTER, buscar bilhetes da Empresa A
GET /tickets?targetCompanyId=<id-empresa-a>
# Deve retornar APENAS bilhetes da Empresa A
```

---

## 🐛 Troubleshooting

### Problema: "Usuário ADMIN sem empresa associada"

**Causa**: Usuário ADMIN não tem `companyId` definido

**Solução**:
```sql
-- Verificar companyId do usuário
SELECT id, username, "companyId" FROM "User" WHERE username = 'admin.usuario';

-- Associar à empresa correta
UPDATE "User" 
SET "companyId" = '<uuid-da-empresa>' 
WHERE username = 'admin.usuario';
```

### Problema: "ADMIN não pode atualizar outra empresa"

**Causa**: ADMIN tentando acessar dados de outra empresa

**Solução**: Isso é esperado! ADMIN só pode acessar sua própria empresa. Use conta MASTER se precisar acessar múltiplas empresas.

### Problema: TenantSwitcher não aparece

**Causa**: Usuário não é MASTER

**Solução**: TenantSwitcher só aparece para usuários com role MASTER. Verifique:
```sql
SELECT username, role FROM "User" WHERE username = 'seu.usuario';
```

### Problema: Dados vazios após trocar empresa

**Causa**: Empresa selecionada não tem dados

**Solução**: Isso é normal! Cada empresa tem seus próprios dados. Crie dados para a empresa selecionada.

---

## 📝 Checklist de Implantação

### Antes de Ir para Produção

- [ ] Executar migração do banco de dados
- [ ] Criar empresa default
- [ ] Criar usuário MASTER
- [ ] Testar isolamento entre empresas
- [ ] Configurar backups automáticos
- [ ] Ativar HTTPS
- [ ] Configurar rate limiting
- [ ] Revisar logs de segurança
- [ ] Testar white-label em produção
- [ ] Documentar credenciais MASTER (cofre seguro)

### Após Deploy

- [ ] Verificar que API está respondendo
- [ ] Testar login MASTER
- [ ] Criar primeira empresa cliente
- [ ] Testar white-label
- [ ] Verificar relatórios
- [ ] Monitorar performance
- [ ] Configurar alertas de segurança

---

## 📞 Suporte

### Logs de Auditoria

Todas as operações críticas são registradas em:
**Dashboard → Configurações → Logs de Auditoria**

### Logs de Segurança

Tentativas de acesso não autorizado em:
**Dashboard → Configurações → Segurança (MFA)**

### Contato

Para suporte técnico, consulte a documentação completa em:
- `SECURITY_MULTI_TENANT.md` - Segurança
- `MULTI_TENANT_MIGRATION.md` - Migração
- `implementation_plan.md` - Plano técnico

---

## 🎯 Resumo Rápido

**Para MASTER**:
1. Login → Ver TenantSwitcher no header
2. Criar empresas via POST /company
3. Trocar entre empresas pelo dropdown
4. Acessar qualquer empresa via `?targetCompanyId=`

**Para ADMIN**:
1. Login → Ver nome da empresa no header
2. Gerenciar apenas sua empresa
3. Configurar white-label em Configurações → Empresa

**Para CAMBISTA/COBRADOR**:
1. Login → Sistema já filtra automaticamente
2. Ver apenas dados da sua empresa
3. Trabalhar normalmente

**Segurança**:
- ✅ Dados isolados automaticamente
- ✅ Impossível acessar outra empresa (exceto MASTER)
- ✅ Todas operações auditadas
- ✅ White-label por empresa
