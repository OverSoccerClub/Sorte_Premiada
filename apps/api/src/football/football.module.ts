
import { Module } from '@nestjs/common';
import { FootballService } from './football.service';
import { FootballController } from './football.controller';

@Module({
    controllers: [FootballController],
    providers: [FootballService],
})
export class FootballModule { }
