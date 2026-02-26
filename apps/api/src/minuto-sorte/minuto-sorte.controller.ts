import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { MinutoSorteService } from './minuto-sorte.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('minuto-sorte')
export class MinutoSorteController {
    constructor(private readonly minSorteService: MinutoSorteService) { }

    @Post('purchase')
    @UseGuards(JwtAuthGuard)
    async purchase(@Request() req: any, @Body() body: any) {
        if (!req.user.companyId) {
            throw new BadRequestException("Usuário sem empresa vinculada.");
        }
        return this.minSorteService.createTicket({
            ...body,
            userId: req.user.userId,
            companyId: req.user.companyId,
        });
    }
}
