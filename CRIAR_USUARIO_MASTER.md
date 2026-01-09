# Como Criar Usuário MASTER

## 🎯 Opção 1: Via API (Mais Fácil) - RECOMENDADO

### Passo 1: Gerar Hash da Senha

Execute este comando Node.js para gerar o hash bcrypt:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('sua-senha-aqui', 10).then(console.log)"
```

**Exemplo**:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('master123', 10).then(console.log)"
```

Isso vai gerar algo como:
```
$2b$10$8K1p/a0dL3.I9/YS8.pjKOuhmRXdqXMXcPXqr0L5JYqXqXqXqXqXq
```

### Passo 2: Inserir no Banco de Dados

Execute este SQL no seu banco PostgreSQL:

```sql
-- Criar usuário MASTER
INSERT INTO "User" (
    id,
    username,
    password,
    name,
    email,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'master',                                                    -- ← Seu username
    '$2b$10$8K1p/a0dL3.I9/YS8.pjKOuhmRXdqXMXcPXqr0L5JYqXqXqXqXqXq',  -- ← Hash da senha
    'Administrador Master',                                      -- ← Seu nome
    'master@sistema.com',                                        -- ← Seu email
    'MASTER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Verificar criação
SELECT username, name, email, role, "isActive" 
FROM "User" 
WHERE role = 'MASTER';
```

---

## 🎯 Opção 2: Via Script PowerShell (Automático)

Crie um arquivo `create-master.ps1`:

```powershell
# Configurações
$username = "master"
$password = "master123"  # ← TROQUE ESTA SENHA!
$name = "Administrador Master"
$email = "master@sistema.com"

# Gerar hash bcrypt
$hash = node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$password', 10).then(console.log)"

# SQL
$sql = @"
INSERT INTO \"User\" (
    id, username, password, name, email, role, \"isActive\", \"createdAt\", \"updatedAt\"
)
VALUES (
    gen_random_uuid(),
    '$username',
    '$hash',
    '$name',
    '$email',
    'MASTER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

SELECT username, name, email, role FROM \"User\" WHERE role = 'MASTER';
"@

# Executar (ajuste a connection string)
psql -U postgres -d seu_banco -c $sql
```

Execute:
```bash
.\create-master.ps1
```

---

## 🎯 Opção 3: SQL Direto (Senha de Teste)

**⚠️ APENAS PARA DESENVOLVIMENTO/TESTE**

```sql
-- Criar MASTER com senha "master123"
INSERT INTO "User" (
    id,
    username,
    password,
    name,
    email,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'master',
    '$2b$10$8K1p/a0dL3.I9/YS8.pjKOuhmRXdqXMXcPXqr0L5JYqXqXqXqXqXq',
    'Administrador Master',
    'master@sistema.com',
    'MASTER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;
```

**Credenciais de Teste**:
- Username: `master`
- Password: `master123`

**⚠️ IMPORTANTE**: Troque esta senha imediatamente em produção!

---

## 🎯 Opção 4: Atualizar Usuário Existente para MASTER

Se você já tem um usuário ADMIN e quer transformá-lo em MASTER:

```sql
-- Transformar usuário existente em MASTER
UPDATE "User"
SET role = 'MASTER'
WHERE username = 'seu-usuario-admin';

-- Verificar
SELECT username, name, role FROM "User" WHERE username = 'seu-usuario-admin';
```

---

## ✅ Verificação

Após criar o usuário MASTER, verifique:

```sql
-- Listar todos os usuários MASTER
SELECT 
    username,
    name,
    email,
    role,
    "isActive",
    "createdAt"
FROM "User"
WHERE role = 'MASTER'
ORDER BY "createdAt" DESC;
```

---

## 🧪 Testar Login

### Via API:

```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "username": "master",
  "password": "master123"
}
```

### Via Dashboard Web:

1. Acesse: `http://localhost:3000`
2. Username: `master`
3. Password: `master123`
4. Você deve ver o **TenantSwitcher** no header (canto superior direito)
5. No sidebar, você deve ver a **coroa** 👑 indicando modo MASTER

---

## 🔒 Segurança em Produção

### 1. Senha Forte

Use uma senha forte com:
- Mínimo 12 caracteres
- Letras maiúsculas e minúsculas
- Números
- Caracteres especiais

**Exemplo**: `M@ster2024!Secure#`

### 2. Gerar Hash Seguro

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('M@ster2024!Secure#', 10).then(console.log)"
```

### 3. Trocar Senha Regularmente

```sql
-- Atualizar senha do MASTER
UPDATE "User"
SET password = '$2b$10$NOVO_HASH_AQUI',
    "updatedAt" = NOW()
WHERE username = 'master' AND role = 'MASTER';
```

### 4. Ativar MFA (Futuramente)

O sistema já tem suporte para MFA. Ative para o usuário MASTER:

```sql
UPDATE "User"
SET "mfaEnabled" = true
WHERE username = 'master' AND role = 'MASTER';
```

---

## 📋 Checklist de Criação

- [ ] Gerar hash bcrypt da senha
- [ ] Executar SQL de criação
- [ ] Verificar que usuário foi criado
- [ ] Testar login via API
- [ ] Testar login via dashboard web
- [ ] Verificar que TenantSwitcher aparece
- [ ] Verificar que coroa 👑 aparece no sidebar
- [ ] Trocar senha de teste por senha forte (produção)
- [ ] Documentar credenciais em local seguro

---

## ❓ Troubleshooting

### Erro: "duplicate key value violates unique constraint"

Usuário já existe. Para atualizar:

```sql
UPDATE "User"
SET password = '$2b$10$NOVO_HASH',
    role = 'MASTER',
    "updatedAt" = NOW()
WHERE username = 'master';
```

### Erro: "relation User does not exist"

Execute a migração do banco primeiro:
```bash
cd packages/database
npx prisma migrate deploy
```

### TenantSwitcher não aparece

Verifique que o role está correto:

```sql
SELECT username, role FROM "User" WHERE username = 'master';
```

Deve retornar `role = 'MASTER'` (tudo maiúsculo).

---

## 🎉 Pronto!

Agora você tem um usuário MASTER e pode:
- ✅ Acessar todas as empresas
- ✅ Criar novas empresas
- ✅ Gerenciar configurações
- ✅ Ver relatórios globais

**Próximo passo**: Criar sua primeira empresa via POST /company! 🚀
