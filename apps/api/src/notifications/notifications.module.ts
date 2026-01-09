import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [NotificationsService, SchedulerService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
