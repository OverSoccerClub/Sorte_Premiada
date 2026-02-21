# Fluxo de Ativação de Dispositivos (POS)

Documento de referência para o fluxo completo de ativação e verificação de dispositivos. Fonte da verdade: **API/banco**.

---

## 1. Visão geral

- **Um código de ativação** = um registro em `PosTerminal` (criado ao gerar código no admin), inicialmente com `deviceId: "pending-{code}"`, `isActive: false`.
- **Ativação** = usuário digita o código no app → API associa o **deviceId físico** (UUID estável da instalação) ao registro, gera JWT e retorna token + companyId + settings.
- **Fonte da verdade**: na abertura do app, o cliente chama `GET /devices/verify` com o token; só permanece “ativado” se a API confirmar (dispositivo encontrado, ativo, token batendo).

---

## 2. App – Inicialização (CompanyContext)

1. **loadStoredData()**  
   Carrega do AsyncStorage: `@device_token`, `@company_id`, `@activation_code`, `@company_settings`.  
   Define `isActivated = !!token` (estado otimista).

2. **Sem token**  
   `setIsActivated(false)`, `setIsLoading(false)` → usuário é redirecionado para `/activation`.

3. **Com token**  
   - Chama **verifyDeviceWithBackend(token)** → `GET /devices/verify` com header `x-device-token`.
   - Se a API retornar **401**:
     - Mensagem contém **"desativado"** ou **"não encontrado"** / **"nao encontrado"** → considera revogado, chama **clearActivation()**, `setIsLoading(false)` → vai para ativação.
     - Caso contrário (ex.: "Token inválido ou expirado", erro de rede) → **não** limpa ativação; retorna `true` e mantém usuário ativado.
   - Se **verify** retornar `false` → clearActivation + setIsLoading(false).
   - Se **verify** retornar `true` → `setIsActivated(true)`, chama **fetchSettings(token)**.

4. **fetchSettings(token)**  
   - `GET /company/settings` com `x-device-token`.
   - Em **401/403/404**: só chama **clearActivation()** se a mensagem contiver **"desativado"** ou **"não encontrado"** / **"nao encontrado"**.  
   - Não usa "inválido ou inativo" para limpar (evita desativar por token expirado).
   - Em **finally** → `setIsLoading(false)`.

5. **Redirecionamento para ativação**  
   No `index.tsx` (login): redireciona para `/activation` apenas quando `!companyLoading && !isActivated`.

---

## 3. ApiClient (requisições autenticadas)

- Em toda resposta **401**, lê o body e verifica a mensagem.
- Só remove token e chama **notifyDeviceInvalidated()** (que dispara clearActivation no CompanyContext) se a mensagem contiver **"desativado"** ou **"não encontrado"** / **"nao encontrado"**.
- 401 genérico (ex.: "Token inválido ou expirado") **não** limpa ativação.

---

## 4. POS Tracking (usePosTracking)

- **Register e heartbeat só rodam quando o dispositivo está ativado** (`deviceToken` do CompanyContext é truthy).
- Evita criar registros “órfãos” (deviceId físico sem companyId/token) no banco, que geravam “pedir ativação” indevido.
- Efeito depende de `[user, deviceToken]`: sem token, não chama register nem inicia o loop de heartbeat.

---

## 5. API – Endpoints relevantes

| Endpoint              | Uso |
|-----------------------|-----|
| `GET /devices/verify` | Público. Recebe `x-device-token`. Valida JWT, busca registro por `id: payload.deviceId`, exige `device`, `isActive`, `device.deviceToken === token`. Em erro repassa a mensagem real (ex.: "Dispositivo não encontrado", "Dispositivo desativado", "Token inválido ou expirado"). |
| `POST /devices/activate` | Público. Body: `activationCode`, `deviceId` (físico). Conflito por deviceId: mesma empresa → arquiva o antigo; outra empresa → Forbidden; órfão → deleta. Atualiza o registro do código com deviceId físico, deviceToken, activatedAt, isActive. |
| `GET /company/settings` | Requer `x-device-token`. Usa `validateDeviceToken`; mesmas mensagens 401 que acima. |
| Heartbeat | Usa **deviceId físico** (não token). Se dispositivo não existir ou não estiver ativado, 401 "Dispositivo não encontrado. Por favor, ative...". O app **não** usa ApiClient no heartbeat, então 401 do heartbeat não dispara clearActivation. |

---

## 6. Quando o app “pede ativação” corretamente

- Não há token no AsyncStorage.
- **verify** retorna 401 com "desativado" ou "não encontrado" (dispositivo revogado ou registro inexistente).
- **fetchSettings** retorna 401/403/404 com "desativado" ou "não encontrado".
- ApiClient recebe 401 com uma dessas mensagens em qualquer chamada autenticada.

---

## 7. Quando **não** deve pedir ativação

- Token existe e **verify** retorna 200 → mantém ativado.
- 401 com "Token inválido ou expirado" ou erro de rede → **não** limpa ativação (usuário continua ativado até haver revogação explícita no servidor).

---

## 8. Registros “órfãos” e correção

- **Órfão**: registro em `PosTerminal` com `deviceId` físico preenchido mas `companyId`/`deviceToken`/`activatedAt` null (ex.: criado por register antigo antes da correção).
- Com a alteração em **usePosTracking**, o app **não** chama register até ter token; assim não cria novos órfãos.
- Órfãos já existentes: ao ativar com código no mesmo deviceId físico, a API deleta o órfão e atualiza o registro do código. Solução prática: gerar novo código no admin e ativar de novo no app.

---

## 9. Chaves AsyncStorage

- `@device_token` – JWT do dispositivo  
- `@company_id` – ID da empresa  
- `@activation_code` – Código usado na ativação  
- `@company_settings` – Cache das configurações (com timestamp)

---

*Última revisão: fluxo alinhado com verify + fetchSettings + ApiClient (revogar só em "desativado"/"não encontrado") e register/heartbeat apenas quando ativado.*
