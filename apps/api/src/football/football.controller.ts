
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FootballService } from './football.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('football')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FootballController {
    constructor(private readonly footballService: FootballService) { }

    @Get('fixtures')
    @Roles(Role.ADMIN, 'MASTER')
    async getFixtures(@Query('date') date: string) {
        // Simple validation YYYY-MM-DD
        if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Default to today if invalid or missing? Or throw error. 
            // Better to throw error to be explicit.
            const today = new Date().toISOString().split('T')[0];
            return this.footballService.getFixtures(today);
        }
        return this.footballService.getFixtures(date);
    }
}
