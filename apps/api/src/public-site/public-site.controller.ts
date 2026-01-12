import { Controller, Get, Query } from '@nestjs/common';
import { PublicSiteService } from './public-site.service';

@Controller('public')
export class PublicSiteController {
    constructor(private readonly publicSiteService: PublicSiteService) { }

    /**
     * Endpoint público para buscar últimos resultados
     * GET /public/results/latest?companyId=xxx&limit=10
     */
    @Get('results/latest')
    async getLatestResults(
        @Query('companyId') companyId?: string,
        @Query('limit') limit?: string
    ) {
        // Usa 'default' como companyId padrão se não fornecido
        const effectiveCompanyId = companyId || 'default';
        const effectiveLimit = limit ? parseInt(limit, 10) : 10;

        return this.publicSiteService.getLatestResults(effectiveCompanyId, effectiveLimit);
    }

    /**
     * Endpoint público para buscar próximos sorteios
     * GET /public/draws/upcoming?companyId=xxx&limit=5
     */
    @Get('draws/upcoming')
    async getUpcomingDraws(
        @Query('companyId') companyId?: string,
        @Query('limit') limit?: string
    ) {
        // Usa 'default' como companyId padrão se não fornecido
        const effectiveCompanyId = companyId || 'default';
        const effectiveLimit = limit ? parseInt(limit, 10) : 5;

        return this.publicSiteService.getUpcomingDraws(effectiveCompanyId, effectiveLimit);
    }
}
