import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { NeighborhoodsService } from './neighborhoods.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('neighborhoods')
@UseGuards(JwtAuthGuard)
export class NeighborhoodsController {
    constructor(private readonly neighborhoodsService: NeighborhoodsService) { }

    @Post()
    create(@Body() createNeighborhoodDto: { name: string; areaId: string }, @Req() req: any) {
        // Determine Company Context
        const user = req.user;
        // Assuming user has companyId properly attached in JWT strategy or User lookup
        // For now getting from request user object
        const companyId = user.companyId || (req.headers['x-company-id'] as string);

        // If Admin/Master, might pass companyId
        if (!companyId) throw new Error("Company ID missing in context");

        return this.neighborhoodsService.create({
            ...createNeighborhoodDto,
            companyId
        });
    }

    @Get()
    findAll(@Query('areaId') areaId: string, @Req() req: any) {
        const user = req.user;
        const companyId = user.companyId || (req.headers['x-company-id'] as string);
        // Support filtering by targetCompanyId if SuperAdmin? For now stick to user's company
        const targetCompanyId = (req.query.targetCompanyId as string) || companyId;

        return this.neighborhoodsService.findAll(targetCompanyId, areaId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.neighborhoodsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: { name?: string; areaId?: string }) {
        return this.neighborhoodsService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.neighborhoodsService.remove(id);
    }
}
