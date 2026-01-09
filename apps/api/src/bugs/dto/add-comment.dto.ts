import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { BugStatus } from '@prisma/client';

export class AddCommentDto {
    @IsString()
    @IsNotEmpty()
    comment: string;

    @IsBoolean()
    @IsOptional()
    statusChange?: boolean;

    @IsEnum(BugStatus)
    @IsOptional()
    previousStatus?: BugStatus;

    @IsEnum(BugStatus)
    @IsOptional()
    newStatus?: BugStatus;
}
