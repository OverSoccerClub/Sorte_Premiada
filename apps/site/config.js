// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const CONFIG = {
    // URL da API - preferência para variável de ambiente
    API_URL: (window.ENV && window.ENV.API_URL) || 'https://pos-jogos-api.uawtgc.easypanel.host',

    // ID da empresa (multi-tenancy)
    // Preferência para variável de ambiente
    COMPANY_ID: (window.ENV && window.ENV.COMPANY_ID) || 'default',

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
