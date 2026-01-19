# Script SQL - Remover Dispositivo

## 📋 Instruções de Uso

### 1. Conectar ao Banco de Dados

Abra seu cliente PostgreSQL favorito (pgAdmin, DBeaver, psql, etc.) e conecte ao banco de dados.

### 2. Executar os Comandos

Execute os comandos **na ordem**:

#### Passo 1: Consultar o Dispositivo
```sql
SELECT 
    pt.id,
    pt."deviceId",
    pt.name,
    pt."activationCode",
    pt."isActive",
    c."companyName" as empresa,
    pt."activatedAt"
FROM "PosTerminal" pt
LEFT JOIN "CompanySettings" c ON pt."companyId" = c.id
WHERE pt."deviceId" = 'ARSP51031240297';
```

**Verifique** se o dispositivo está vinculado à "Lotto Forte".

#### Passo 2: Remover o Vínculo
```sql
UPDATE "PosTerminal"
SET 
    "companyId" = NULL,
    "currentUserId" = NULL,
    "lastUserId" = NULL,
    "areaId" = NULL,
    "activationCode" = NULL,
    "deviceToken" = NULL,
    "activatedAt" = NULL,
    "isActive" = false,
    "name" = NULL,
    "description" = NULL,
    "updatedAt" = NOW()
WHERE "deviceId" = 'ARSP51031240297';
```

#### Passo 3: Verificar
```sql
SELECT 
    pt.id,
    pt."deviceId",
    pt.name,
    pt."activationCode",
    pt."isActive",
    c."companyName" as empresa,
    pt."activatedAt"
FROM "PosTerminal" pt
LEFT JOIN "CompanySettings" c ON pt."companyId" = c.id
WHERE pt."deviceId" = 'ARSP51031240297';
```

**Resultado esperado**:
- `companyName`: NULL
- `activationCode`: NULL
- `isActive`: false

### 3. Ativar na Nova Empresa

Após executar o script:

1. No **dashboard web** da "A Perseverança"
2. Vá em **Dispositivos POS**
3. **Gere um novo código de ativação**
4. No **app mobile**, use o código para ativar

---

## ⚠️ Observações

- O dispositivo **NÃO será deletado**, apenas desvinculado
- Você pode ativá-lo novamente em qualquer empresa
- O histórico de uso anterior será mantido

## 🔧 Alternativa: Deletar Completamente

Se preferir deletar o registro:

```sql
DELETE FROM "PosTerminal"
WHERE "deviceId" = 'ARSP51031240297';
```

⚠️ **Não recomendado**: Isso remove todo o histórico do dispositivo.
