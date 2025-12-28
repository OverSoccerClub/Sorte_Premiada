
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
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
    create(@Body() data: { gameId: string; winningNumber: number; prizeAmount: number; drawDate: string }) {
        return this.service.create(data);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id/winners')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findWinners(@Param('id') id: string) {
        return this.service.findWinners(id);
    }

    @Get(':id/participants')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findParticipants(@Param('id') id: string) {
        return this.service.findParticipants(id);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
