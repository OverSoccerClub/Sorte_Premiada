import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Query, Request } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('areas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Post()
    @Roles('ADMIN', 'MASTER')
    create(@Body() createAreaDto: CreateAreaDto, @Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        // Determinar o companyId correto
        let companyId = req.user.companyId;

        // MASTER pode especificar targetCompanyId
        if (targetCompanyId) {
            if (req.user.role === 'MASTER' || targetCompanyId === req.user.companyId) {
                companyId = targetCompanyId;
            }
        }

        return this.areasService.create(createAreaDto, companyId);
    }

    @Get()
    findAll(@Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        // Determinar o companyId correto
        let companyId = req.user.companyId;

        // MASTER pode especificar targetCompanyId
        if (targetCompanyId) {
            if (req.user.role === 'MASTER' || targetCompanyId === req.user.companyId) {
                companyId = targetCompanyId;
            }
            // Se não for MASTER e tentar acessar outra empresa, ignora o target (ou podíamos dar erro, mas manter padrão seguro é melhor)
            // Neste caso, se for ADMIN e mandar target diferente, cai no default dele (sua própria empresa)
        }

        // Se companyId for null/undefined, o service retornará todas as áreas
        // (útil para ADMIN sem empresa ou MASTER sem targetCompanyId)
        return this.areasService.findAll(companyId);
    }

    @Get(':id')
    @Roles('ADMIN', 'MASTER', 'CAMBISTA', 'COBRADOR')
    findOne(@Param('id') id: string, @Request() req: any) {
        const restrictedCompanyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.areasService.findOne(id, restrictedCompanyId);
    }

    @Patch(':id')
    @Roles('ADMIN', 'MASTER')
    update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto, @Request() req: any) {
        const restrictedCompanyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.areasService.update(id, updateAreaDto, restrictedCompanyId);
    }

    @Delete(':id')
    @Roles('ADMIN', 'MASTER')
    remove(@Param('id') id: string, @Request() req: any) {
        const restrictedCompanyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.areasService.remove(id, restrictedCompanyId);
    }

    @Post(':id/cycle-series')
    @Roles('ADMIN', 'MASTER')
    async cycleSeries(@Param('id') id: string, @Request() req: any) {
        console.log(`[API] Manual Series Cycle for Area ${id} by User ${req.user.userId}`);
        const restrictedCompanyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.areasService.cycleSeries(id, restrictedCompanyId);
    }
}
