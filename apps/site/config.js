// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const CONFIG = {
    // URL da API - ajuste conforme seu ambiente
    API_URL: 'https://pos-jogos-api.uawtgc.easypanel.host',

    // ID da empresa (multi-tenancy)
    // Use o slug da sua empresa ou 'default'
    COMPANY_ID: 'default',

    // Intervalo de atualização automática (em milissegundos)
    // 30000 = 30 segundos
    REFRESH_INTERVAL: 30000,

    // Quantidade de resultados a exibir
    MAX_RESULTS: 10,

    // Quantidade de próximos sorteios a exibir
    MAX_UPCOMING: 5
};

// Exporta a configuração para uso global
window.CONFIG = CONFIG;
