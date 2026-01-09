import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() data: any, @Request() req: any) {
        return this.announcementsService.create({
            ...data,
            companyId: req.user?.companyId
        });
    }

    @Get()
    @Roles('ADMIN')
    findAll(@Request() req: any) {
        return this.announcementsService.findAll(req.user?.companyId);
    }

    @Get('active')
    findAllActive(@Request() req: any) {
        return this.announcementsService.findAllActive(req.user?.userId, req.user?.companyId);
    }

    @Get(':id')
    @Roles('ADMIN')
    findOne(@Param('id') id: string) {
        return this.announcementsService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() data: any) {
        return this.announcementsService.update(id, data);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.announcementsService.remove(id);
    }
}
