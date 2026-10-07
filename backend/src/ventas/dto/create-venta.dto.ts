export interface DetalleVentaDto {
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    vaciosRecibidos?: number;
}

export class CreateVentaDto {
    clienteId?: number;

    tipo!: 'CONTADO' | 'CREDITO';

    detalles!: DetalleVentaDto[];

    fechaVencimiento?: string;
}