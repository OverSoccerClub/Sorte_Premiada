import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('areas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areasService.create(createAreaDto);
    }

    @Get()
    findAll() {
        return this.areasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.areasService.findOne(id);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.areasService.remove(id);
    }
}
