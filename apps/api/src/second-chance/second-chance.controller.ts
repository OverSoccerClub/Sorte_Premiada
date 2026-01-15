
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SecondChanceService } from './second-chance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('second-chance-draws')
@UseGuards(JwtAuthGuard)
export class SecondChanceController {
    constructor(private readonly service: SecondChanceService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    create(@Body() data: { gameId: string; winningNumber: number; prizeAmount: number; drawDate: string }, @Request() req: any) {
        return this.service.create({ ...data, companyId: req.user.companyId });
    }

    @Get()
    findAll(@Request() req: any) {
        return this.service.findAll(req.user.companyId);
    }

    @Get(':id/winners')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findWinners(@Param('id') id: string, @Request() req: any) {
        return this.service.findWinners(id, req.user.companyId);
    }

    @Get(':id/participants')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findParticipants(@Param('id') id: string, @Request() req: any) {
        return this.service.findParticipants(id, req.user.companyId);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string, @Request() req: any) {
        return this.service.remove(id, req.user.companyId);
    }
}
