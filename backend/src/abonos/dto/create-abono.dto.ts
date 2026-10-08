
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAbonoDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    cuentaCobrarId!: number;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    monto!: number;

    @IsOptional()
    @IsString()
    observacion?: string;
}
