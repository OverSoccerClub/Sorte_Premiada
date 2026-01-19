# Script de Remoção de Dispositivo

Este script remove um dispositivo POS de uma empresa específica, permitindo que ele seja ativado em outra empresa.

## Como Usar

### 1. Editar o Device ID

Abra o arquivo `remove-device-from-company.ts` e edite a linha:

```typescript
const DEVICE_ID = 'ARSP51031240297'; // Substitua pelo deviceId correto
```

### 2. Executar o Script

```bash
cd apps/api
npx ts-node scripts/remove-device-from-company.ts
```

## O que o Script Faz

O script realiza as seguintes ações:

1. **Busca** o dispositivo pelo `deviceId`
2. **Exibe** informações do dispositivo encontrado
3. **Verifica** se está vinculado à empresa "Lotto Forte"
4. **Desassocia** o dispositivo da empresa, limpando:
   - `companyId`
   - `currentUserId`
   - `lastUserId`
   - `areaId`
   - `activationCode`
   - `deviceToken`
   - `activatedAt`
   - `isActive` (define como `false`)
   - `name`
   - `description`

## Opções

### Opção 1: Desassociar (RECOMENDADO)
Mantém o registro do dispositivo no banco, mas remove todas as associações. O dispositivo pode ser ativado novamente.

**Código atual** (já configurado no script)

### Opção 2: Deletar Completamente
Remove o registro do dispositivo do banco de dados.

Para usar esta opção, descomente as linhas no script:

```typescript
// OPÇÃO 1: Deletar completamente o dispositivo
await prisma.posTerminal.delete({
    where: {
        id: device.id
    }
});
```

E comente a OPÇÃO 2.

## Após Executar

Depois de executar o script com sucesso:

1. O dispositivo estará **livre** para ser ativado
2. No app mobile, você pode **gerar um novo código de ativação** para "A Perseverança"
3. **Ativar** o dispositivo normalmente com o novo código

## Troubleshooting

### Dispositivo não encontrado
- Verifique se o `deviceId` está correto
- O deviceId geralmente é o número de série do dispositivo (ex: `ARSP51031240297`)

### Erro de permissão
- Certifique-se de que o banco de dados está acessível
- Verifique as credenciais no arquivo `.env`

### Dispositivo em outra empresa
- O script mostrará um aviso se o dispositivo não estiver na "Lotto Forte"
- Você pode editar o script para remover a verificação se necessário
