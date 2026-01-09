# 🧪 Sistema de Testes Automatizados - MegaSena

Sistema completo de testes automatizados com cobertura de API e E2E, gerando relatórios detalhados com screenshots e vídeos.

## 📋 Estrutura

```
apps/
├── api/tests/              # Testes de API
│   ├── integration/
│   │   ├── auth.test.ts
│   │   └── isolation.test.ts
│   └── helpers.ts
│
└── web/tests/              # Testes E2E
    └── e2e/
        ├── auth.spec.ts
        ├── pos.spec.ts
        └── isolation.spec.ts

test-reports/               # Relatórios gerados
├── api/
│   ├── html/              # Relatório HTML da API
│   ├── json/              # Dados JSON
│   └── coverage/          # Cobertura de código
├── e2e/
│   ├── html/              # Relatório HTML E2E
│   ├── screenshots/       # Screenshots de falhas
│   └── videos/            # Vídeos de falhas
└── dashboard/
    └── index.html         # Dashboard consolidado
```

## 🚀 Como Usar

### Executar Todos os Testes
```bash
npm test
```

Isso irá:
1. ✅ Executar testes de API
2. ✅ Executar testes E2E
3. ✅ Gerar relatório consolidado

### Executar Apenas Testes de API
```bash
npm run test:api
```

### Executar Apenas Testes E2E
```bash
npm run test:e2e
```

### Modo Watch (API)
```bash
npm run test:watch
```

### Gerar Apenas Relatório
```bash
npm run test:report
```

## 📊 Visualizar Relatórios

Após executar os testes, abra:

**Dashboard Consolidado**:
```
test-reports/dashboard/index.html
```

**Relatório de API**:
```
test-reports/api/html/index.html
```

**Relatório E2E**:
```
test-reports/e2e/html/index.html
```

## 🧪 Testes Implementados

### Testes de API (Jest + Supertest)

#### Autenticação (`auth.test.ts`)
- ✅ Login com credenciais válidas
- ✅ Rejeitar login com usuário inválido
- ✅ Rejeitar login com senha inválida
- ✅ Rejeitar login sem credenciais

#### Isolamento de Dados (`isolation.test.ts`)
- ✅ Company A vê apenas seus usuários
- ✅ Company B vê apenas seus usuários
- ✅ Company A não acessa dados da Company B
- ✅ MASTER pode acessar qualquer empresa
- ✅ Isolamento de Games
- ✅ Isolamento de Areas
- ✅ Isolamento de Tickets
- ✅ Isolamento de Draws

### Testes E2E (Playwright)

#### Autenticação (`auth.spec.ts`)
- ✅ Login bem-sucedido
- ✅ Erro em credenciais inválidas
- ✅ Logout

#### POS Management (`pos.spec.ts`)
- ✅ Navegar para página POS
- ✅ Aba Monitoramento ativa por padrão
- ✅ Trocar para aba Ativação
- ✅ Gerar código de ativação
- ✅ Copiar código
- ✅ Dispositivo aparece na lista

#### Isolamento E2E (`isolation.spec.ts`)
- ✅ Company A não vê usuários da Company B
- ✅ Company A não vê jogos da Company B
- ✅ Company A não vê áreas da Company B
- ✅ targetCompanyId bloqueado para não-MASTER

## 📸 Screenshots e Vídeos

Quando um teste E2E falha:
- 📸 **Screenshot** é capturado automaticamente
- 🎥 **Vídeo** da execução é gravado
- 📁 Salvos em `test-reports/e2e/screenshots/` e `test-reports/e2e/videos/`

## 🔧 Configuração

### Variáveis de Ambiente

Crie `.env.test` na raiz do projeto:

```env
# API
DATABASE_URL="postgresql://user:pass@localhost:5432/megasena_test"
JWT_SECRET="test-secret"

# Web
BASE_URL="http://localhost:3000"
```

### Credenciais de Teste

Edite `apps/api/tests/helpers.ts` para configurar:

```typescript
export const TEST_CREDENTIALS = {
  MASTER: {
    username: 'master',
    password: 'master123',
  },
  COMPANY_A_ADMIN: {
    username: 'admin_a',
    password: 'admin123',
  },
  COMPANY_B_ADMIN: {
    username: 'admin_b',
    password: 'admin123',
  },
};
```

## 📈 Exemplo de Relatório

```
🧪 Test Report Dashboard
Generated: 05/01/2026 16:00:00

┌─────────────────────────────────────┐
│ Summary                             │
├─────────────────────────────────────┤
│ Total Tests:    45                  │
│ ✅ Passed:      43 (95.6%)          │
│ ❌ Failed:      2 (4.4%)            │
│ ⏱️  Duration:   12.3s               │
└─────────────────────────────────────┘

API Tests (25 total)
├─ ✅ Authentication (4/4)
├─ ✅ Isolation (21/21)

E2E Tests (20 total)
├─ ✅ Authentication (3/3)
├─ ❌ POS (5/6) - 1 failed
└─ ✅ Isolation (11/11)

❌ Failures:

1. E2E: POS - Should generate activation code
   Error: Button not found
   Screenshot: test-reports/e2e/screenshots/pos-1.png
   Video: test-reports/e2e/videos/pos-1.webm
```

## 🎯 Próximos Passos

### Adicionar Mais Testes
1. Criar `apps/api/tests/integration/users.test.ts`
2. Criar `apps/web/tests/e2e/users.spec.ts`
3. Adicionar testes de performance

### CI/CD
Adicionar ao GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: test-reports/
```

## 🐛 Troubleshooting

### Testes de API Falhando
```bash
# Verificar se banco de dados está rodando
docker ps

# Rodar migrações
npm run prisma:migrate

# Limpar cache do Jest
cd apps/api && npx jest --clearCache
```

### Testes E2E Falhando
```bash
# Instalar navegadores do Playwright
cd apps/web && npx playwright install

# Verificar se servidor está rodando
npm run dev
```

## 📚 Documentação

- [Jest](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Playwright](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## ✅ Checklist de Testes

- [x] Autenticação
- [x] Isolamento de Dados
- [x] POS Management
- [ ] Criação de Usuários
- [ ] Criação de Jogos
- [ ] Criação de Bilhetes
- [ ] Cancelamento de Bilhetes
- [ ] Prestação de Contas
- [ ] Relatórios
- [ ] Performance

---

**Desenvolvido com ❤️ para garantir qualidade e confiabilidade do sistema MegaSena**
