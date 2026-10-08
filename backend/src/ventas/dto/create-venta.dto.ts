import {
    IsArray,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DetalleVentaDto {
    @IsInt()
    @IsPositive()
    productoId!: number;

    @IsInt()
    @IsPositive()
    cantidad!: number;

    @IsNumber()
    @Min(0)
    precioUnitario!: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    vaciosRecibidos?: number;
}

export class CreateVentaDto {
    @IsOptional()
    @IsInt()
    @IsPositive()
    clienteId?: number;

    @IsIn(['CONTADO', 'CREDITO'])
    tipo!: 'CONTADO' | 'CREDITO';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DetalleVentaDto)
    detalles!: DetalleVentaDto[];

    @IsOptional()
    @IsString()
    fechaVencimiento?: string;
}