# Desvincular Dispositivo (MASTER)

## 📋 Funcionalidade

Endpoint exclusivo para usuários **MASTER** forçarem a desvinculação de dispositivos problemáticos que estão presos em outras empresas.

---

## 🔧 Como Usar

### Opção 1: Via Postman/Insomnia

```http
POST http://192.168.20.102:3000/devices/force-unbind
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_MASTER

{
  "deviceId": "ARSP51031240297"
}
```

### Opção 2: Via PowerShell

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer SEU_TOKEN_MASTER"
}

$body = @{
    deviceId = "ARSP51031240297"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.20.102:3000/devices/force-unbind" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### Opção 3: Via cURL (CMD)

```bash
curl -X POST http://192.168.20.102:3000/devices/force-unbind ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer SEU_TOKEN_MASTER" ^
  -d "{\"deviceId\": \"ARSP51031240297\"}"
```

---

## 📤 Resposta de Sucesso

```json
{
  "message": "2 registro(s) deletado(s) com sucesso",
  "deletedCount": 2,
  "deletedDevices": [
    {
      "id": "uuid-1",
      "deviceId": "ARSP51031240297",
      "companyName": "Lotto Forte",
      "activatedAt": "2026-01-15T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "deviceId": "archived_1234567890_ARSP51031240297",
      "companyName": "Lotto Forte",
      "activatedAt": "2026-01-10T08:20:00.000Z"
    }
  ]
}
```

---

## ✅ O que o Endpoint Faz

1. **Busca** TODOS os registros relacionados ao `deviceId`:
   - Registro exato (`ARSP51031240297`)
   - Registros arquivados (`archived_*_ARSP51031240297`)
   - Registros pendentes (`pending-*`)
   - Qualquer variação que contenha o deviceId

2. **Deleta** todos os registros encontrados

3. **Retorna** lista detalhada do que foi deletado

---

## 🔒 Segurança

- ✅ **Apenas MASTER** pode executar
- ✅ Requer autenticação JWT válida
- ✅ Logs detalhados de todas as ações
- ✅ Retorna informações sobre o que foi deletado

---

## 📝 Caso de Uso Atual

**Problema**: Dispositivo `ARSP51031240297` está preso na "Lotto Forte" e não pode ser ativado na "A Perseverança".

**Solução**:
1. Execute o endpoint `force-unbind` com o deviceId
2. Limpe o cache do app: `adb shell pm clear com.anonymous.sortepremiada`
3. Gere novo código de ativação para "A Perseverança"
4. Ative o dispositivo normalmente

---

## 🎯 Próximos Passos

Para facilitar ainda mais, você pode criar uma interface no dashboard web para MASTER executar essa ação com um clique, sem precisar usar Postman ou scripts.
