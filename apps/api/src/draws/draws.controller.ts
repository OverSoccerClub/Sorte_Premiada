
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { DrawsService } from './draws.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('draws')
export class DrawsController {
    constructor(private readonly drawsService: DrawsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    create(@Body() createDrawDto: any, @Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        // Determinar o companyId correto
        let companyId = req.user.companyId;
        if (req.user.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        }

        return this.drawsService.create(createDrawDto, companyId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Query('gameId') gameId?: string, @Query('targetCompanyId') targetCompanyId?: string, @Request() req?: any) {
        // Determinar o companyId para filtro
        let companyId = req?.user?.companyId;
        if (req?.user?.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        }

        if (gameId) {
            return this.drawsService.findByGame(gameId, companyId);
        }
        return this.drawsService.findAll(companyId);
    }

    @Get('liability-report')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    getLiabilityReport(@Query('gameId') gameId: string, @Query('drawDate') drawDate: string, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.getLiabilityReport(gameId, drawDate, companyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.drawsService.findOne(id);
    }

    @Get(':id/details')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    getDetails(@Param('id') id: string, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.getDrawDetails(id, companyId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    update(@Param('id') id: string, @Body() updateDrawDto: any, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.update(id, updateDrawDto, companyId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    remove(@Param('id') id: string, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.remove(id, companyId);
    }
}
