import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env.dev') });

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando seed para Palpita Ai...");

    // Find the first Palpita Ai game
    const game = await prisma.game.findFirst({
        where: { type: 'PAIPITA_AI' },
        include: { company: true }
    });

    if (!game) {
        console.error("❌ Nenhum jogo do tipo PAIPITA_AI encontrado no banco de dados.");
        return;
    }

    console.log(`✅ Jogo encontrado: ${game.name} (ID: ${game.id})`);

    // Create a new draw for tomorrow
    const drawDate = new Date();
    drawDate.setDate(drawDate.getDate() + 1);
    drawDate.setHours(16, 0, 0, 0);

    // Get the next series number
    const nextSeries = game.lastSeries + 1;

    // Fictional matches
    const matchesData = [
        { homeTeam: 'Flamengo', awayTeam: 'Vasco', matchOrder: 1 },
        { homeTeam: 'Corinthians', awayTeam: 'Palmeiras', matchOrder: 2 },
        { homeTeam: 'São Paulo', awayTeam: 'Santos', matchOrder: 3 },
        { homeTeam: 'Grêmio', awayTeam: 'Internacional', matchOrder: 4 },
        { homeTeam: 'Cruzeiro', awayTeam: 'Atlético-MG', matchOrder: 5 },
        { homeTeam: 'Fluminense', awayTeam: 'Botafogo', matchOrder: 6 },
        { homeTeam: 'Bahia', awayTeam: 'Vitória', matchOrder: 7 },
        { homeTeam: 'Athletico-PR', awayTeam: 'Coritiba', matchOrder: 8 },
        { homeTeam: 'Fortaleza', awayTeam: 'Ceará', matchOrder: 9 },
        { homeTeam: 'Sport', awayTeam: 'Náutico', matchOrder: 10 },
        { homeTeam: 'Goiás', awayTeam: 'Atlético-GO', matchOrder: 11 },
        { homeTeam: 'Paysandu', awayTeam: 'Remo', matchOrder: 12 },
        { homeTeam: 'Avaí', awayTeam: 'Figueirense', matchOrder: 13 },
        { homeTeam: 'Ponte Preta', awayTeam: 'Guarani', matchOrder: 14 },
    ];

    const newDraw = await prisma.draw.create({
        data: {
            gameId: game.id,
            companyId: game.companyId,
            drawDate: drawDate,
            description: `Sorteio Teste via Seed #${nextSeries}`,
            series: nextSeries,
            matches: {
                create: matchesData.map(m => ({
                    homeTeam: m.homeTeam,
                    awayTeam: m.awayTeam,
                    matchOrder: m.matchOrder,
                    matchDate: drawDate,
                    result: null
                }))
            }
        }
    });

    // Update game series
    await prisma.game.update({
        where: { id: game.id },
        data: { lastSeries: nextSeries }
    });

    console.log(`🎉 Concurso criado com sucesso! ID: ${newDraw.id}`);
    console.log(`Data do Sorteio: ${drawDate.toLocaleString('pt-BR')}`);
    console.log(`Série: ${nextSeries}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
