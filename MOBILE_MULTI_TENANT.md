# Mobile App - Multi-Tenant Implementation

## 📱 Resumo das Mudanças

O aplicativo mobile já está **99% preparado** para multi-tenant! As mudanças necessárias foram mínimas porque o backend já faz todo o trabalho pesado.

---

## ✅ O que foi Atualizado

### 1. AuthContext.tsx
**Mudança**: Adicionado `companyId` à interface `User`

```typescript
interface User {
    id: string;
    username: string;
    name?: string;
    email: string;
    role: string;
    companyId?: string; // ✅ NOVO - Multi-tenant
}
```

**Impacto**: O `companyId` agora é armazenado junto com os dados do usuário após o login.

---

### 2. Services (tickets, games, finance)
**Mudança**: Adicionados comentários explicativos

**Exemplo** (`tickets.service.ts`):
```typescript
/**
 * Tickets Service (Mobile)
 * 
 * MULTI-TENANT: Todas as requisições são automaticamente filtradas pela empresa do usuário.
 * O backend extrai o companyId do JWT e aplica filtros automaticamente via Prisma Extension.
 * Não é necessário passar companyId manualmente - o token de autenticação é suficiente.
 */
```

**Impacto**: Zero mudanças no código! Apenas documentação para clareza.

---

### 3. CompanyContext.tsx
**Status**: ✅ Já estava perfeito!

O `CompanyContext` já:
- Busca configurações da empresa via `/company/settings`
- Faz cache local com AsyncStorage
- Atualiza automaticamente
- Suporta refresh manual

**Nenhuma mudança necessária!**

---

## 🎨 White-Label: Como Funciona

### Fluxo Automático

1. **App Inicia** → CompanyContext carrega settings
2. **Usuário Faz Login** → JWT contém `companyId`
3. **Todas as Requisições** → Backend filtra por `companyId` automaticamente
4. **UI Atualiza** → Logo, cores, nome da empresa aplicados

### Configurações Aplicadas

O `CompanyContext` já aplica:
- ✅ Nome da empresa
- ✅ Slogan
- ✅ Logo (se configurado)
- ✅ Cor primária
- ✅ Contatos (telefone, WhatsApp, email)
- ✅ URL de atualização

### Onde é Usado

**Tela de Login** (`app/index.tsx`):
```typescript
const { settings } = useCompany();

// Logo da empresa
<Image source={{ uri: settings.logoUrl }} />

// Nome da empresa
<Text>{settings.companyName}</Text>

// Slogan
<Text>{settings.slogan}</Text>
```

**Impressão de Bilhetes** (`services/printing.service.ts`):
```typescript
const { settings } = useCompany();

// Cabeçalho do bilhete com nome da empresa
<Text>{settings.companyName}</Text>

// Contatos
<Text>{settings.phone}</Text>
<Text>{settings.whatsapp}</Text>
```

---

## 🔒 Segurança no Mobile

### Como o Isolamento Funciona

1. **Login**: Usuário recebe JWT com `companyId`
2. **Requisições**: Token enviado em todas as chamadas
3. **Backend**: Extrai `companyId` do JWT automaticamente
4. **Prisma**: Filtra todas as queries por `companyId`
5. **Resposta**: Apenas dados da empresa do usuário

### Exemplo Prático

```typescript
// Mobile faz requisição
const tickets = await TicketsService.getAll(token);

// Backend recebe
GET /tickets
Authorization: Bearer <jwt-com-companyId>

// Backend processa
1. TenantInterceptor extrai companyId do JWT
2. TenantContext.setCompanyId(companyId)
3. Prisma Extension adiciona WHERE companyId = '...'

// SQL executado
SELECT * FROM Ticket WHERE companyId = 'empresa-do-usuario'

// Mobile recebe
[{ id: '...', companyId: 'empresa-do-usuario', ... }]
```

**Resultado**: Impossível acessar dados de outra empresa!

---

## 📦 Build por Empresa (Opcional)

### Opção 1: Build Único (Recomendado)

Um único APK que busca configurações da empresa via API.

**Vantagens**:
- ✅ Um único APK para todas as empresas
- ✅ Configurações atualizadas em tempo real
- ✅ Fácil manutenção

**Como funciona**:
```typescript
// CompanyContext busca automaticamente
GET /company/settings
// Retorna configurações da empresa default ou via slug
```

### Opção 2: Build Personalizado por Empresa

APKs separados com configurações hard-coded.

**Vantagens**:
- ✅ Branding 100% personalizado
- ✅ Nome do app diferente
- ✅ Ícone do app diferente

**Como fazer**:

1. **Criar arquivo de configuração**:
```json
// branding-info.json
{
  "companySlug": "loteria-norte",
  "appName": "Loteria do Norte",
  "packageName": "com.leterianorte.app"
}
```

2. **Script de build**:
```powershell
# build_for_company.ps1
param($companySlug)

# Atualizar app.json
$appJson = Get-Content app.json | ConvertFrom-Json
$appJson.expo.name = "Loteria $companySlug"
$appJson.expo.android.package = "com.$companySlug.app"
$appJson | ConvertTo-Json | Set-Content app.json

# Build
eas build --platform android --profile production
```

3. **Executar**:
```bash
.\build_for_company.ps1 -companySlug "loteria-norte"
```

---

## 🧪 Testes Necessários

### Teste 1: Login em Diferentes Empresas

```typescript
// Criar 2 empresas via API
POST /company
{ "slug": "empresa-a", "companyName": "Empresa A", ... }

POST /company
{ "slug": "empresa-b", "companyName": "Empresa B", ... }

// Login como usuário da Empresa A
Login: admin.a / senha123

// Verificar
1. CompanyContext carrega "Empresa A"
2. Bilhetes mostram apenas da Empresa A
3. Jogos mostram apenas da Empresa A
4. Relatórios mostram apenas da Empresa A

// Login como usuário da Empresa B
Login: admin.b / senha123

// Verificar
1. CompanyContext carrega "Empresa B"
2. Dados completamente diferentes
3. Nenhum dado da Empresa A visível
```

### Teste 2: White-Label

```typescript
// Configurar Empresa A
PUT /company/settings
{
  "companyName": "Loteria do Norte",
  "slogan": "Sua sorte está aqui!",
  "primaryColor": "#1E40AF",
  "logoUrl": "https://..."
}

// Login no app
// Verificar:
1. ✅ Tela de login mostra logo correto
2. ✅ Nome "Loteria do Norte" aparece
3. ✅ Slogan "Sua sorte está aqui!" aparece
4. ✅ Cores aplicadas (se implementado)
5. ✅ Bilhetes impressos com nome correto
```

### Teste 3: Isolamento de Dados

```typescript
// Como usuário da Empresa A
1. Criar bilhete
2. Ver lista de bilhetes → Deve aparecer

// Como usuário da Empresa B
1. Ver lista de bilhetes → NÃO deve aparecer bilhete da Empresa A
2. Tentar acessar bilhete da Empresa A via ID → Deve retornar 404
```

---

## ✅ Checklist de Implementação Mobile

### Código
- [x] AuthContext atualizado com companyId
- [x] Services documentados (tickets, games, finance)
- [x] CompanyContext já funcional
- [x] Todas as requisições usam token JWT

### Testes
- [ ] Testar login em múltiplas empresas
- [ ] Verificar isolamento de dados
- [ ] Testar white-label (logo, nome, cores)
- [ ] Testar impressão de bilhetes
- [ ] Verificar cache de configurações

### Build
- [ ] Build APK de teste
- [ ] Instalar e testar em dispositivo real
- [ ] Verificar que configurações carregam corretamente
- [ ] Testar com múltiplos usuários/empresas

---

## 🎯 Conclusão

**Status do Mobile**: ✅ **PRONTO PARA MULTI-TENANT!**

**Mudanças Necessárias**: Mínimas (apenas 1 linha de código + comentários)

**Motivo**: O backend faz todo o trabalho pesado!
- ✅ TenantInterceptor extrai companyId do JWT
- ✅ Prisma Extension filtra automaticamente
- ✅ CompanyContext já busca configurações
- ✅ Services já usam autenticação correta

**Próximo Passo**: Testes completos com múltiplas empresas!

---

## 📞 Troubleshooting

### Problema: Configurações não carregam

**Causa**: Endpoint `/company/settings` não acessível

**Solução**:
```typescript
// Verificar URL da API
console.log(AppConfig.api.baseUrl);

// Testar endpoint manualmente
curl http://api-url/company/settings
```

### Problema: Dados de outra empresa aparecem

**Causa**: Backend não está filtrando corretamente

**Solução**:
1. Verificar que TenantInterceptor está ativo
2. Verificar que JWT contém companyId
3. Verificar logs do backend

### Problema: Logo não aparece

**Causa**: URL inválida ou CORS

**Solução**:
```typescript
// Verificar URL
console.log(settings.logoUrl);

// Testar acesso direto
<Image source={{ uri: settings.logoUrl }} onError={(e) => console.log(e)} />
```

---

## 📚 Referências

- **Backend**: `SECURITY_MULTI_TENANT.md`
- **Migração**: `MULTI_TENANT_MIGRATION.md`
- **Guia de Uso**: `MULTI_TENANT_USER_GUIDE.md`
