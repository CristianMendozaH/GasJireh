import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto.js';

@Injectable()
export class InventarioService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) { }

    async findAll() {
        return await this.databaseService.db.orm.public.Inventario.all();
    }

    async inicializar() {
        const productos =
            await this.databaseService.db.orm.public.Producto.all();

        const inventarios =
            await this.databaseService.db.orm.public.Inventario.all();

        const registrosCreados = [];

        for (const producto of productos) {
            const existeLleno = inventarios.some(
                (inventario) =>
                    inventario.productoId === producto.id &&
                    inventario.estado === 'LLENO',
            );

            const existeVacio = inventarios.some(
                (inventario) =>
                    inventario.productoId === producto.id &&
                    inventario.estado === 'VACIO',
            );

            if (!existeLleno) {
                const nuevoLleno =
                    await this.databaseService.db.orm.public.Inventario.create({
                        productoId: producto.id,
                        estado: 'LLENO',
                        cantidad: 0,
                    });

                registrosCreados.push(nuevoLleno);
            }

            if (!existeVacio) {
                const nuevoVacio =
                    await this.databaseService.db.orm.public.Inventario.create({
                        productoId: producto.id,
                        estado: 'VACIO',
                        cantidad: 0,
                    });

                registrosCreados.push(nuevoVacio);
            }
        }

        return registrosCreados;
    }

    async registrarMovimiento(
        dto: CreateMovimientoInventarioDto,
        usuarioId: number,
    ) {
        // 1. Validar cantidad
        if (!Number.isInteger(dto.cantidad) || dto.cantidad <= 0) {
            throw new BadRequestException(
                'La cantidad debe ser un número entero mayor que 0',
            );
        }

        // 2. Buscar producto
        const producto =
            await this.databaseService.db.orm.public.Producto
                .where({ id: dto.productoId })
                .first();

        if (!producto) {
            throw new NotFoundException('Producto no encontrado');
        }

        // 3. Buscar inventario del producto según su estado
        const inventario =
            await this.databaseService.db.orm.public.Inventario
                .where({
                    productoId: dto.productoId,
                    estado: dto.estado,
                })
                .first();

        if (!inventario) {
            throw new NotFoundException(
                'No existe un registro de inventario para este producto y estado',
            );
        }

        // 4. Calcular nueva cantidad
        let nuevaCantidad = inventario.cantidad;

        switch (dto.tipo) {
            case 'ENTRADA':
            case 'DEVOLUCION':
                nuevaCantidad += dto.cantidad;
                break;

            case 'SALIDA':
            case 'VENTA':
                if (inventario.cantidad < dto.cantidad) {
                    throw new BadRequestException(
                        `Existencia insuficiente. Disponible: ${inventario.cantidad}`,
                    );
                }

                nuevaCantidad -= dto.cantidad;
                break;

            case 'AJUSTE':
                throw new BadRequestException(
                    'Los ajustes de inventario se implementarán mediante una operación específica',
                );

            default:
                throw new BadRequestException(
                    'Tipo de movimiento no válido',
                );
        }

        // 5. Actualizar cantidad real en PostgreSQL
        const inventarioActualizado =
            await this.databaseService.db.orm.public.Inventario
                .where({ id: inventario.id })
                .update({
                    cantidad: nuevaCantidad,
                });

        if (!inventarioActualizado) {
            throw new BadRequestException(
                'No fue posible actualizar el inventario',
            );
        }

        // 6. Registrar movimiento en el historial
        const movimiento =
            await this.databaseService.db.orm.public.MovimientoInventario.create({
                productoId: dto.productoId,
                usuarioId,
                tipo: dto.tipo,
                estado: dto.estado,
                cantidad: dto.cantidad,
                motivo: dto.motivo ?? null,
                referencia: dto.referencia ?? null,
            });

        // 7. Respuesta
        return {
            producto: {
                id: producto.id,
                nombre: producto.nombre,
                pesoLb: producto.pesoLb,
            },

            inventario: {
                cantidadAnterior: inventario.cantidad,
                cantidadNueva: inventarioActualizado.cantidad,
                estado: inventarioActualizado.estado,
            },

            movimiento,
        };
    }
}