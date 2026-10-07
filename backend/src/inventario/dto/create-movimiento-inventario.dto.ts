export class CreateMovimientoInventarioDto {
    productoId: number;

    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'VENTA' | 'DEVOLUCION';

    estado: 'LLENO' | 'VACIO';

    cantidad: number;

    motivo?: string;

    referencia?: string;
}