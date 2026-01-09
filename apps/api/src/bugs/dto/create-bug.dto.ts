import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { BugSeverity, BugPriority } from '@prisma/client';

export class CreateBugDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(BugSeverity)
    severity: BugSeverity;

    @IsEnum(BugPriority)
    priority: BugPriority;

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
}
