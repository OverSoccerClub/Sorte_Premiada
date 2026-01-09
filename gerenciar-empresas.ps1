# ============================================
# Script para Gerenciar Empresas via API
# ============================================
# 
# Use este script enquanto o frontend não está atualizado
# com o TenantSwitcher
#
# ============================================

# CONFIGURAÇÃO
$API_URL = "https://pos-jogos-api.uawtgc.easypanel.host"

# IMPORTANTE: Cole seu token JWT aqui (faça login e pegue do localStorage)
$TOKEN = "SEU_TOKEN_AQUI"

# ============================================
# FUNÇÃO: Listar todas as empresas
# ============================================
function Get-AllCompanies {
    Write-Host "`n=== LISTANDO TODAS AS EMPRESAS ===" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/company/all" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $TOKEN"
            }
        
        $response | Format-Table -Property id, slug, companyName, createdAt -AutoSize
        
        Write-Host "`nTotal: $($response.Count) empresa(s)" -ForegroundColor Green
    }
    catch {
        Write-Host "Erro ao listar empresas: $_" -ForegroundColor Red
    }
}

# ============================================
# FUNÇÃO: Criar nova empresa
# ============================================
function New-Company {
    param(
        [string]$slug,
        [string]$companyName,
        [string]$adminUsername,
        [string]$adminPassword,
        [string]$adminName = "Administrador",
        [string]$slogan = "",
        [string]$primaryColor = "#10B981",
        [string]$phone = "",
        [string]$whatsapp = "",
        [string]$email = ""
    )
    
    Write-Host "`n=== CRIANDO NOVA EMPRESA ===" -ForegroundColor Cyan
    Write-Host "Nome: $companyName" -ForegroundColor Yellow
    Write-Host "Slug: $slug" -ForegroundColor Yellow
    Write-Host "Admin: $adminUsername" -ForegroundColor Yellow
    
    $body = @{
        slug = $slug
        companyName = $companyName
        slogan = $slogan
        primaryColor = $primaryColor
        adminName = $adminName
        adminUsername = $adminUsername
        adminPassword = $adminPassword
        phone = $phone
        whatsapp = $whatsapp
        email = $email
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/company" `
            -Method POST `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $TOKEN"
            } `
            -Body $body
        
        Write-Host "`n✓ Empresa criada com sucesso!" -ForegroundColor Green
        Write-Host "`nDetalhes da Empresa:" -ForegroundColor Cyan
        $response.company | Format-List
        
        Write-Host "`nUsuário Admin Criado:" -ForegroundColor Cyan
        $response.adminUser | Format-List
        
        return $response
    }
    catch {
        Write-Host "Erro ao criar empresa: $_" -ForegroundColor Red
        Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
    }
}

# ============================================
# FUNÇÃO: Atualizar configurações de empresa
# ============================================
function Update-CompanySettings {
    param(
        [string]$companyId,
        [hashtable]$settings
    )
    
    Write-Host "`n=== ATUALIZANDO CONFIGURAÇÕES ===" -ForegroundColor Cyan
    Write-Host "Empresa ID: $companyId" -ForegroundColor Yellow
    
    $body = $settings | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/company/settings?targetCompanyId=$companyId" `
            -Method PUT `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $TOKEN"
            } `
            -Body $body
        
        Write-Host "`n✓ Configurações atualizadas com sucesso!" -ForegroundColor Green
        $response | Format-List
        
        return $response
    }
    catch {
        Write-Host "Erro ao atualizar configurações: $_" -ForegroundColor Red
    }
}

# ============================================
# EXEMPLOS DE USO
# ============================================

Write-Host @"

╔════════════════════════════════════════════════════════════╗
║     GERENCIADOR DE EMPRESAS MULTI-TENANT - API CLI        ║
╚════════════════════════════════════════════════════════════╝

IMPORTANTE: Antes de usar, atualize a variável `$TOKEN com seu JWT!

Para obter o token:
1. Faça login no dashboard
2. Abra o DevTools (F12)
3. Console → digite: localStorage.getItem('token')
4. Copie o token e cole na variável `$TOKEN no início deste script

════════════════════════════════════════════════════════════

COMANDOS DISPONÍVEIS:

1. Listar todas as empresas:
   Get-AllCompanies

2. Criar nova empresa:
   New-Company -slug "loteria-norte" `
               -companyName "Loteria do Norte" `
               -adminUsername "admin.norte" `
               -adminPassword "senha123" `
               -adminName "João Silva" `
               -slogan "Sua sorte está aqui!" `
               -primaryColor "#1E40AF" `
               -phone "(11) 98765-4321" `
               -whatsapp "(11) 98765-4321" `
               -email "contato@loterianorte.com"

3. Atualizar configurações:
   Update-CompanySettings -companyId "uuid-da-empresa" `
                          -settings @{
                              companyName = "Novo Nome"
                              primaryColor = "#FF0000"
                              slogan = "Novo slogan"
                          }

════════════════════════════════════════════════════════════

EXEMPLO RÁPIDO - Criar primeira empresa:

New-Company -slug "empresa-teste" `
            -companyName "Empresa Teste" `
            -adminUsername "admin.teste" `
            -adminPassword "teste123"

════════════════════════════════════════════════════════════

"@ -ForegroundColor White

# Verificar se token está configurado
if ($TOKEN -eq "SEU_TOKEN_AQUI") {
    Write-Host "⚠️  ATENÇÃO: Configure o TOKEN antes de usar!" -ForegroundColor Red
    Write-Host "Edite este arquivo e substitua 'SEU_TOKEN_AQUI' pelo seu JWT" -ForegroundColor Yellow
}
else {
    Write-Host "✓ Token configurado! Você pode usar os comandos acima." -ForegroundColor Green
}
