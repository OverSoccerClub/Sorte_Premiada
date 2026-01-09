import { IsString, IsEnum, IsOptional } from 'class-validator';
import { BugStatus, BugSeverity, BugPriority } from '@prisma/client';

export class UpdateBugDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(BugStatus)
    @IsOptional()
    status?: BugStatus;

    @IsEnum(BugSeverity)
    @IsOptional()
    severity?: BugSeverity;

    @IsEnum(BugPriority)
    @IsOptional()
    priority?: BugPriority;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    stepsToReproduce?: string;

    @IsString()
    @IsOptional()
    environment?: string;

    @IsString()
    @IsOptional()
    assignedToUserId?: string;

    @IsString()
    @IsOptional()
    fixDescription?: string;
}
