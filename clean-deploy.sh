#!/bin/bash
# 🧹 Script de Limpeza de Cache e Rebuild Seguro
# Uso: bash clean-deploy.sh

set -e

echo "🚀 Iniciando Protocolo de Limpeza de Servidor..."
echo "================================================"

# 1. Parar serviços atuais (opcional, mas recomendado para limpeza profunda)
echo "🛑 Parando containers (se existirem)..."
# Tenta parar pelo docker-compose ou comando docker comum
if command -v docker-compose &> /dev/null; then
    docker-compose down --remove-orphans || true
else
    docker compose down --remove-orphans || true
fi

# 2. Limpeza Profunda do Docker
echo "🧹 Executando Docker System Prune (Isso remove caches antigos)..."
# Remove containers parados, redes não usadas e IMAGENS PENDENTES (dangling)
# O flag -a removeria todas as imagens não usadas (mais agressivo, mas mais seguro para o seu caso)
# Adicionamos -f para não pedir confirmação interativa
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
if command -v docker-compose &> /dev/null; then
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
