import { Module } from '@nestjs/common';
import { MinutoSorteController } from './minuto-sorte.controller';
import { MinutoSorteAdminController } from './minuto-sorte-admin.controller';
import { MinutoSorteService } from './minuto-sorte.service';
import { TicketsModule } from '../tickets/tickets.module';
import { DrawsModule } from '../draws/draws.module';

@Module({
    imports: [TicketsModule, DrawsModule],
    controllers: [MinutoSorteController, MinutoSorteAdminController],
    providers: [MinutoSorteService],
    exports: [MinutoSorteService],
})
export class MinutoSorteModule { }
