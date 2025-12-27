
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
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
    @Roles(Role.ADMIN)
    create(@Body() createDrawDto: any) {
        return this.drawsService.create(createDrawDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Query('gameId') gameId?: string) {
        if (gameId) {
            return this.drawsService.findByGame(gameId);
        }
        return this.drawsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.drawsService.findOne(id);
    }

    @Get(':id/details')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    getDetails(@Param('id') id: string) {
        return this.drawsService.getDrawDetails(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    update(@Param('id') id: string, @Body() updateDrawDto: any) {
        return this.drawsService.update(id, updateDrawDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.drawsService.remove(id);
    }
}
