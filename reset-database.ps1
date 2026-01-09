# Script para resetar o banco de dados e popular com dados corretos
# ATENÇÃO: Este script irá APAGAR TODOS OS DADOS do banco de dados!

Write-Host "⚠️  ATENÇÃO: Este script irá APAGAR TODOS OS DADOS do banco de dados!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Tem certeza que deseja continuar? (digite 'SIM' para confirmar)"

if ($confirmation -ne "SIM") {
    Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🔄 Iniciando reset do banco de dados..." -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório do database package
Set-Location "packages\database"

# Executar reset do Prisma (apaga todos os dados e recria as tabelas)
Write-Host "📦 Executando Prisma migrate reset..." -ForegroundColor Yellow
npx prisma migrate reset --force --skip-seed

# Executar o seed completo
Write-Host ""
Write-Host "🌱 Populando banco de dados com dados iniciais..." -ForegroundColor Yellow
npx tsx prisma/seed-complete.ts

# Voltar para o diretório raiz
Set-Location "..\..\"

Write-Host ""
Write-Host "✅ Banco de dados resetado e populado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Credenciais padrão:" -ForegroundColor Cyan
Write-Host "   MASTER:   master / master123" -ForegroundColor White
Write-Host "   ADMIN:    Imperial / admin123" -ForegroundColor White
Write-Host "   ADMIN:    admin / admin123" -ForegroundColor White
Write-Host "   CAMBISTA: cambista1 / cambista123" -ForegroundColor White
Write-Host "   COBRADOR: 123456 / cobrador123 (PIN: 1234)" -ForegroundColor White
Write-Host ""
