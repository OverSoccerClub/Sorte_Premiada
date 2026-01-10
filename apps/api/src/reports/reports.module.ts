import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

import { FinancialReportsService } from './financial-reports.service';
import { FinancialReportsController } from './financial-reports.controller';

@Module({
    controllers: [ReportsController, AnalyticsController, FinancialReportsController],
    providers: [ReportsService, AnalyticsService, FinancialReportsService],
})
export class ReportsModule { }
