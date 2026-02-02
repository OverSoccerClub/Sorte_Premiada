#!/bin/sh
# 🧹 Script de Limpeza de Cache e Rebuild Seguro
# Uso: sh clean-deploy.sh

set -e

echo "🚀 Iniciando Protocolo de Limpeza de Servidor..."
echo "================================================"

# Verificação de Ambiente
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ ERRO CRÍTICO: Comando 'docker' não encontrado!"
    echo "⚠️  Você provavelmente está rodando este script DENTRO do container (pasta /app)."
    echo "💡 Este script precisa ser rodado no SERVIDOR (HOST) via SSH, ou use o botão de 'Rebuild' no painel do EasyPanel."
    exit 1
fi

# 1. Parar serviços atuais
echo "🛑 Parando containers (se existirem)..."
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose down --remove-orphans || true
else
    docker compose down --remove-orphans || true
fi

# 2. Limpeza Profunda do Docker
echo "🧹 Executando Docker System Prune (Isso remove caches antigos)..."
docker system prune -a -f

echo "✅ Cache do Docker limpo."
echo ""

# 3. Reinstalar dependências limpas
if [ -f "package-lock.json" ]; then
    echo "📦 Regenerando package-lock.json para garantir integridade..."
    rm -rf node_modules
    rm package-lock.json
    npm install --legacy-peer-deps
    echo "✅ Dependências reinstaladas do zero."
fi

# 4. Rebuild com flag --no-cache
echo "🔨 Iniciando Rebuild Forçado (No Cache)..."
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose build --no-cache
    docker-compose up -d --force-recreate
else
    docker compose build --no-cache
    docker compose up -d --force-recreate
fi

echo ""
echo "================================================"
echo "✅ LIMPEZA E DEPLOY CONCLUÍDOS"
echo "================================================"
echo "🛡️  O ambiente agora deve estar livre de caches maliciosos."
