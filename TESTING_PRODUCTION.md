# 🌐 Testando em Produção (Easypanel)

Guia completo para executar testes automatizados no servidor de produção hospedado no Easypanel.

---

## 📋 Pré-requisitos

1. ✅ Servidor rodando no Easypanel
2. ✅ URLs de acesso:
   - **Web**: `https://pos-jogos.uawtgc.easypanel.host`
   - **API**: `https://pos-jogos-api.uawtgc.easypanel.host`
3. ✅ Credenciais de teste válidas
4. ✅ IDs das empresas no banco de dados

---

## ⚙️ Configuração

### 1. Editar `.env.production.test`

Abra o arquivo `.env.production.test` e configure:

```env
# URLs do Servidor Easypanel
BASE_URL=https://pos-jogos.uawtgc.easypanel.host
API_URL=https://pos-jogos-api.uawtgc.easypanel.host

# Credenciais de Teste (USE CREDENCIAIS REAIS DO SEU SISTEMA)
TEST_MASTER_USERNAME=master
TEST_MASTER_PASSWORD=sua-senha-master

TEST_COMPANY_A_USERNAME=admin
TEST_COMPANY_A_PASSWORD=sua-senha-admin

# IDs das Empresas (PEGUE DO BANCO DE DADOS)
TEST_COMPANY_A_ID=f311e9cc-dd17-44ca-a050-c149b150e296
TEST_COMPANY_B_ID=outro-id-de-empresa

# Configurações de Teste
HEADLESS=true          # true = sem interface visual
SLOW_MO=0             # 0 = velocidade normal
TIMEOUT=30000         # 30 segundos
```

### 2. Como Pegar os IDs das Empresas

**Opção A: Via Banco de Dados**
```sql
SELECT id, name, slug FROM "Company";
```

**Opção B: Via API**
```bash
curl https://pos-jogos-api.uawtgc.easypanel.host/companies \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🚀 Executar Testes em Produção

### Comando Principal

```bash
npm run test:prod
```

Isso irá:
1. ✅ Executar testes E2E no servidor Easypanel
2. ✅ Capturar screenshots de falhas
3. ✅ Gravar vídeos de falhas
4. ✅ Gerar relatório consolidado

### Saída Esperada

```
[E2E] Running 3 tests using 1 worker
[E2E]  ✓  [chromium] › auth.spec.ts:12:3 › Login flow (4.5s)
[E2E]  ✓  [chromium] › pos.spec.ts:45:5 › POS Device Management (6.2s)
[E2E]  ✓  [chromium] › isolation.spec.ts:80:5 › Multi-tenant data isolation (5.8s)
[E2E] 3 passed (18.5s)

Generating report...
Dashboard available at: ./test-reports/dashboard/index.html
```

---

## 📊 Visualizar Resultados

### Dashboard Consolidado

```bash
# Abrir no navegador
start test-reports/dashboard/index.html
```

### Relatório E2E Detalhado

```bash
# Abrir relatório do Playwright
cd apps/web
npm run test:e2e:report
```

---

## 🎯 Testes Executados em Produção

### 1. Autenticação (`auth.spec.ts`)

**O que testa**:
- ✅ Login com credenciais válidas
- ✅ Erro com credenciais inválidas
- ✅ Logout

**URL testada**: `https://pos-jogos.uawtgc.easypanel.host/`

### 2. POS Management (`pos.spec.ts`)

**O que testa**:
- ✅ Navegação para `/dashboard/pos`
- ✅ Aba Monitoramento ativa
- ✅ Trocar para aba Ativação
- ✅ Gerar código de ativação
- ✅ Copiar código
- ✅ Dispositivo aparece na lista

**URL testada**: `https://pos-jogos.uawtgc.easypanel.host/dashboard/pos`

### 3. Isolamento de Dados (`isolation.spec.ts`)

**O que testa**:
- ✅ Company A não vê usuários da Company B
- ✅ Company A não vê jogos da Company B
- ✅ Company A não vê áreas da Company B
- ✅ targetCompanyId bloqueado para não-MASTER

**URLs testadas**:
- `https://pos-jogos.uawtgc.easypanel.host/dashboard/users`
- `https://pos-jogos.uawtgc.easypanel.host/dashboard/games`
- `https://pos-jogos.uawtgc.easypanel.host/dashboard/areas`

---

## 🔍 Modo Debug (Com Interface Visual)

Para ver os testes rodando em tempo real:

```bash
# 1. Editar .env.production.test
HEADLESS=false

# 2. Executar com UI
cd apps/web
npm run test:e2e:prod -- --headed
```

Isso abrirá o navegador e você verá os testes executando!

---

## 📸 Screenshots e Vídeos

### Quando um teste falha:

1. **Screenshot** é salvo em:
   ```
   test-reports/e2e/screenshots/
   ```

2. **Vídeo** é salvo em:
   ```
   test-reports/e2e/videos/
   ```

3. **Ambos aparecem no relatório** com botões clicáveis

---

## ⚠️ Cuidados Importantes

### 1. Não Use Dados de Produção Reais

> [!CAUTION]
> Os testes podem **criar, modificar e deletar** dados. Use apenas usuários e empresas de teste!

### 2. Credenciais Seguras

> [!WARNING]
> **NUNCA** comite o arquivo `.env.production.test` com credenciais reais no Git!

Adicione ao `.gitignore`:
```
.env.production.test
.env.test
```

### 3. Rate Limiting

Se o servidor tiver rate limiting, os testes podem falhar. Configure timeouts maiores:

```env
TIMEOUT=60000  # 60 segundos
```

---

## 🐛 Troubleshooting

### Erro: "Timeout waiting for page"

**Causa**: Servidor lento ou indisponível

**Solução**:
```env
# Aumentar timeout
TIMEOUT=60000
```

### Erro: "401 Unauthorized"

**Causa**: Credenciais inválidas

**Solução**:
1. Verificar usuário e senha em `.env.production.test`
2. Testar login manual no navegador
3. Verificar se usuário existe no banco

### Erro: "Cannot find element"

**Causa**: Interface mudou ou elemento não carregou

**Solução**:
```bash
# Rodar com interface visual para ver o problema
cd apps/web
npm run test:e2e:prod -- --headed --debug
```

### Erro: "Network error"

**Causa**: Servidor offline ou URL errada

**Solução**:
1. Verificar se servidor está rodando
2. Testar URL no navegador
3. Verificar firewall/CORS

---

## 📈 Exemplo de Relatório em Produção

```
🧪 Test Report Dashboard - Produção
Generated: 05/01/2026 16:20:00

┌─────────────────────────────────────┐
│ Summary                             │
├─────────────────────────────────────┤
│ Environment: PRODUCTION             │
│ Server: pos-jogos.uawtgc.easypanel  │
│ Total Tests:    15                  │
│ ✅ Passed:      15 (100%)           │
│ ❌ Failed:      0 (0%)              │
│ ⏱️  Duration:   45.2s               │
└─────────────────────────────────────┘

🌐 E2E Tests (15 total)
├─ ✅ auth.spec.ts (3/3)
├─ ✅ pos.spec.ts (6/6)
└─ ✅ isolation.spec.ts (6/6)

✅ All tests passed in production!
```

---

## 🎯 Checklist de Teste em Produção

### Antes de Executar

- [ ] Servidor Easypanel está online
- [ ] URLs configuradas em `.env.production.test`
- [ ] Credenciais de teste válidas
- [ ] IDs das empresas corretos
- [ ] Usuários de teste existem no banco

### Durante Execução

- [ ] Monitorar logs do servidor (se possível)
- [ ] Verificar se não há erros 500
- [ ] Confirmar que testes não afetam dados reais

### Após Execução

- [ ] Verificar relatório gerado
- [ ] Analisar screenshots/vídeos de falhas
- [ ] Limpar dados de teste criados (se necessário)
- [ ] Documentar problemas encontrados

---

## 🚀 Automação com CI/CD

### GitHub Actions (Exemplo)

```yaml
name: Production E2E Tests
on:
  schedule:
    - cron: '0 */6 * * *'  # A cada 6 horas
  workflow_dispatch:

jobs:
  test-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:prod
        env:
          BASE_URL: ${{ secrets.PROD_BASE_URL }}
          TEST_MASTER_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_MASTER_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: test-reports/
```

---

## 📚 Recursos Adicionais

### Documentação

- [Playwright](https://playwright.dev/)
- [Easypanel Docs](https://easypanel.io/docs)

### Arquivos Importantes

- Configuração: `apps/web/playwright.config.ts`
- Testes: `apps/web/tests/e2e/`
- Variáveis: `.env.production.test`

---

## ✅ Resumo

**Para testar em produção**:

```bash
# 1. Configurar .env.production.test
# 2. Executar testes
npm run test:prod

# 3. Ver relatório
start test-reports/dashboard/index.html
```

**Pronto!** 🎉

Seus testes agora rodam no servidor Easypanel e validam o sistema em produção!

---

**Desenvolvido com ❤️ para garantir qualidade em produção**
