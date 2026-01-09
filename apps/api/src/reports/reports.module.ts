import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
    controllers: [ReportsController, AnalyticsController],
    providers: [ReportsService, AnalyticsService],
})
export class ReportsModule { }
