import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';

@Injectable()
export class ProductosService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) { }

    async findAll() {
        return this.databaseService.db.orm.public.Producto.all();
    }

    async create(createProductoDto: CreateProductoDto) {
        const producto =
            await this.databaseService.db.orm.public.Producto.create({
                nombre: createProductoDto.nombre,
                pesoLb: createProductoDto.pesoLb,
                precio: createProductoDto.precio.toString(),
            });

        await this.databaseService.db.orm.public.Inventario.create({
            productoId: producto.id,
            estado: 'LLENO',
            cantidad: 0,
        });

        await this.databaseService.db.orm.public.Inventario.create({
            productoId: producto.id,
            estado: 'VACIO',
            cantidad: 0,
        });

        return producto;
    }

    async actualizarPrecio(id: number, precio: number) {
        if (!Number.isFinite(precio) || precio < 0) {
            throw new BadRequestException(
                'El precio debe ser un número válido mayor o igual a 0',
            );
        }

        const productos =
            await this.databaseService.db.orm.public.Producto.all();

        const producto = productos.find(
            (item) => item.id === id,
        );

        if (!producto) {
            throw new NotFoundException(
                `Producto con id ${id} no encontrado`,
            );
        }

        await this.databaseService.db.orm.public.Producto
            .where({ id })
            .update({
                precio: precio.toString(),
            });

        const productosActualizados =
            await this.databaseService.db.orm.public.Producto.all();

        return productosActualizados.find(
            (item) => item.id === id,
        );
    }
}