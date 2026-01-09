import { IsString, IsNumber, IsInt, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxUsers: number;

    @IsInt()
    @Min(100)
    @Type(() => Number)
    maxTicketsPerMonth: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxGames: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxActiveDevices: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxUsers?: number;

    @IsOptional()
    @IsInt()
    @Min(100)
    @Type(() => Number)
    maxTicketsPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxGames?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxActiveDevices?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
