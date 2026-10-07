import { Injectable } from '@nestjs/common';
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
        const producto = await this.databaseService.db.orm.public.Producto.create({
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
}