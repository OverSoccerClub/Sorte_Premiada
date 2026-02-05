import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AreasConfigService } from './areas-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('areas-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AreasConfigController {
    constructor(private readonly areasConfigService: AreasConfigService) { }

    @Get('area/:areaId')
    @Roles('ADMIN', 'MASTER')
    findByArea(@Param('areaId') areaId: string) {
        return this.areasConfigService.findByArea(areaId);
    }

    @Get('game/:gameId')
    @Roles('ADMIN', 'MASTER')
    findByGame(@Param('gameId') gameId: string) {
        return this.areasConfigService.findByGame(gameId);
    }

    @Post()
    @Roles('ADMIN')
    upsert(@Body() data: any, @Request() req: any) {
        return this.areasConfigService.upsert(data, req.user.userId);
    }

    @Delete(':areaId/:gameId')
    @Roles('ADMIN')
    remove(@Param('areaId') areaId: string, @Param('gameId') gameId: string) {
        return this.areasConfigService.remove(areaId, gameId);
    }
}
