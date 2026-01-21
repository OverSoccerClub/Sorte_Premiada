
import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class FootballService {
    private readonly logger = new Logger(FootballService.name);
    private readonly apiUrl = 'https://v3.football.api-sports.io';

    // Lista de Ligas Prioritárias para filtrar (reduzir ruído)
    private readonly priorityLeagues = [
        71,  // Brasileirão Série A
        72,  // Brasileirão Série B
        39,  // Premier League (Inglaterra)
        140, // La Liga (Espanha)
        135, // Serie A (Itália)
        78,  // Bundesliga (Alemanha)
        61,  // Ligue 1 (França)
        13,  // Libertadores
        11,  // Sul-Americana
        2,   // Champions League
        9,   // Copa America
        475, // Copa do Brasil
    ];

    async getFixtures(date: string) {
        const apiKey = process.env.API_FOOTBALL_KEY;

        if (!apiKey) {
            this.logger.warn('API_FOOTBALL_KEY not found in environment variables.');
            // Retornar dados mockados para teste se nao tiver chave (opcional, ou array vazio)
            return {
                warning: "Chave da API não configurada. Adicione API_FOOTBALL_KEY ao .env",
                fixtures: []
            };
        }

        try {
            const url = `${this.apiUrl}/fixtures?date=${date}`;

            const response = await fetch(url, {
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Error fetching fixtures: ${response.status} - ${errorText}`);
                throw new Error(`External API Error: ${response.status}`);
            }

            const data: any = await response.json();

            if (data.errors && Object.keys(data.errors).length > 0) {
                this.logger.error(`API returned functional errors: ${JSON.stringify(data.errors)}`);
                return { error: data.errors, fixtures: [] };
            }

            // Filtrar e Mapear
            const fixtures = (data.response || [])
                .filter((item: any) => this.priorityLeagues.includes(item.league.id))
                .map((item: any) => ({
                    id: item.fixture.id,
                    date: item.fixture.date,
                    timestamp: item.fixture.timestamp,
                    status: item.fixture.status.short, // NS = Not Started
                    league: {
                        id: item.league.id,
                        name: item.league.name,
                        country: item.league.country,
                        logo: item.league.logo
                    },
                    homeTeam: {
                        id: item.teams.home.id,
                        name: item.teams.home.name,
                        logo: item.teams.home.logo
                    },
                    awayTeam: {
                        id: item.teams.away.id,
                        name: item.teams.away.name,
                        logo: item.teams.away.logo
                    }
                }))
                .sort((a: any, b: any) => a.timestamp - b.timestamp);

            return { fixtures };
        } catch (error) {
            this.logger.error(`Failed to fetch fixtures: ${error.message}`);
            throw error;
        }
    }
}
