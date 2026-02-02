#!/bin/bash
# 🚀 Script de Deploy Automático - Correções de Timezone
# Uso: bash deploy-timezone-fix.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando Deploy de Correções de Timezone..."
echo "================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar diretório
echo "📁 Verificando diretório..."
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erro: Não está no diretório do projeto!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Diretório correto${NC}"
echo ""

# 2. Verificar branch
echo "🌿 Verificando branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Branch atual: $CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Aviso: Você não está na branch main${NC}"
    read -p "Continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 3. Fazer backup
echo "💾 Criando backup..."
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git branch $BACKUP_BRANCH
echo -e "${GREEN}✅ Backup criado: $BACKUP_BRANCH${NC}"
echo ""

# 4. Pull das mudanças
echo "⬇️  Baixando atualizações do GitHub..."
git pull origin main
echo -e "${GREEN}✅ Código atualizado${NC}"
echo ""

# 5. Verificar commits
echo "📝 Últimos commits:"
git log --oneline -5
echo ""

# 6. Verificar se tem os commits necessários
echo "🔍 Verificando commits de timezone..."
if git log --oneline -10 | grep -q "correct timezone\|correct month calculation"; then
    echo -e "${GREEN}✅ Commits de timezone encontrados${NC}"
else
    echo -e "${RED}❌ Commits de timezone não encontrados!${NC}"
    exit 1
fi
echo ""

# 7. Instalar dependências (se necessário)
if [ -f "package-lock.json" ]; then
    echo "📦 Verificando dependências..."
    # Apenas instala se package.json foi modificado
    if git diff HEAD@{1} --name-only | grep -q "package.json"; then
        echo "Instalando dependências..."
        npm install --legacy-peer-deps
        echo -e "${GREEN}✅ Dependências atualizadas${NC}"
    else
        echo -e "${GREEN}✅ Dependências OK (sem mudanças)${NC}"
    fi
    echo ""
fi

# 8. Build (se necessário)
if [ -d "apps/api/dist" ]; then
    echo "🔨 Compilando backend..."
    cd apps/api
    npm run build
    cd ../..
    echo -e "${GREEN}✅ Build concluído${NC}"
    echo ""
fi

# 9. Restart PM2
echo "🔄 Reiniciando serviço API..."
pm2 restart api
echo -e "${GREEN}✅ Serviço reiniciado${NC}"
echo ""

# 10. Aguardar inicialização
echo "⏳ Aguardando inicialização (5s)..."
sleep 5
echo ""

# 11. Verificar status
echo "📊 Status dos serviços:"
pm2 status
echo ""

# 12. Verificar logs
echo "📋 Últimos logs (procurando por erros):"
pm2 logs api --lines 20 --nostream
echo ""

# 13. Teste de saúde
echo "🏥 Testando API..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        echo -e "${GREEN}✅ API respondendo (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  API retornou HTTP $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl não disponível, pulando teste${NC}"
fi
echo ""

# 14. Resumo
echo "================================================"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "================================================"
echo ""
echo "📝 Próximos passos:"
echo "1. Testar dashboard web: https://seu-dominio.com/dashboard"
echo "2. Verificar se mostra vendas de JANEIRO"
echo "3. Monitorar logs: pm2 logs api"
echo ""
echo "🔄 Para rollback, execute:"
echo "   git checkout $BACKUP_BRANCH"
echo "   pm2 restart api"
echo ""
echo "📊 Para ver logs em tempo real:"
echo "   pm2 logs api"
echo ""
