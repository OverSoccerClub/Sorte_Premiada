import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { BugsService } from './bugs.service';
import { CreateBugDto } from './dto/create-bug.dto';
import { UpdateBugDto } from './dto/update-bug.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '@prisma/client';

@Controller('bugs')
@UseGuards(JwtAuthGuard)
export class BugsController {
    constructor(private readonly bugsService: BugsService) { }

    private checkMasterAccess(user: any) {
        if (user.role !== Role.MASTER) {
            throw new ForbiddenException('Acesso negado. Apenas usuários MASTER podem acessar bugs.');
        }
    }

    @Post()
    create(@Request() req: any, @Body() createBugDto: CreateBugDto) {
        this.checkMasterAccess(req.user);
        return this.bugsService.create(createBugDto, req.user.userId, req.user.companyId);
    }

    @Get()
    findAll(
        @Request() req: any,
        @Query('status') status?: string,
        @Query('severity') severity?: string,
        @Query('priority') priority?: string,
        @Query('assignedToUserId') assignedToUserId?: string,
    ) {
        this.checkMasterAccess(req.user);
        return this.bugsService.findAll(req.user.companyId, {
            status: status as any,
            severity: severity as any,
            priority: priority as any,
            assignedToUserId,
        });
    }

    @Get('statistics')
    getStatistics(@Request() req: any) {
        this.checkMasterAccess(req.user);
        return this.bugsService.getStatistics(req.user.companyId);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        this.checkMasterAccess(req.user);
        return this.bugsService.findOne(id, req.user.companyId);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateBugDto: UpdateBugDto) {
        this.checkMasterAccess(req.user);
        return this.bugsService.update(id, updateBugDto, req.user.userId, req.user.companyId);
    }

    @Post(':id/comments')
    addComment(@Request() req: any, @Param('id') id: string, @Body() addCommentDto: AddCommentDto) {
        this.checkMasterAccess(req.user);
        return this.bugsService.addComment(id, addCommentDto, req.user.userId, req.user.companyId);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        this.checkMasterAccess(req.user);
        return this.bugsService.delete(id, req.user.companyId);
    }
}
