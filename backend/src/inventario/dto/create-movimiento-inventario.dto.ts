import {
    IsInt,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateMovimientoInventarioDto {
    @IsInt()
    @Min(1)
    productoId!: number;

    @IsIn(['ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA', 'DEVOLUCION'])
    tipo!: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'VENTA' | 'DEVOLUCION';

    @IsIn(['LLENO', 'VACIO'])
    estado!: 'LLENO' | 'VACIO';

    @IsInt()
    @Min(1)
    cantidad!: number;

    @IsOptional()
    @IsString()
    motivo?: string;

    @IsOptional()
    @IsString()
    referencia?: string;
}