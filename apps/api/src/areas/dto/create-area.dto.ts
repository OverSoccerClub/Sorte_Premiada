import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAreaDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    state: string;
}
