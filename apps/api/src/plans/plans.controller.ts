import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PlansController {
    private readonly logger = new Logger(PlansController.name);

    constructor(private readonly plansService: PlansService) { }

    @Post()
    @Roles('MASTER')
    create(@Body() data: CreatePlanDto) {
        this.logger.log(`POST /plans - Creating plan: ${data.name}`);
        return this.plansService.create(data);
    }

    @Get()
    @Get()
    findAll(@Query('all') all: string) {
        this.logger.log(`GET /plans?all=${all}`);
        // Se ?all=true, traz inativos também
        return this.plansService.findAll(all === 'true');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        this.logger.log(`GET /plans/${id}`);
        return this.plansService.findOne(id);
    }

    @Put(':id')
    @Roles('MASTER')
    update(@Param('id') id: string, @Body() data: UpdatePlanDto) {
        this.logger.log(`PUT /plans/${id} - Updating plan`);
        return this.plansService.update(id, data);
    }

    @Delete(':id')
    @Roles('MASTER')
    remove(@Param('id') id: string) {
        this.logger.log(`DELETE /plans/${id}`);
        return this.plansService.remove(id);
    }

    @Post(':id/apply/:companyId')
    @Roles('MASTER')
    applyToCompany(@Param('id') id: string, @Param('companyId') companyId: string) {
        this.logger.log(`POST /plans/${id}/apply/${companyId}`);
        return this.plansService.applyPlanToCompany(companyId, id);
    }
}
