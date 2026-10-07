import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class InventarioService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) { }

    async findAll() {
        return this.databaseService.db.orm.public.Inventario.all();
    }

    async inicializar() {
        const productos = await this.databaseService.db.orm.public.Producto.all();

        const inventarios = [];

        for (const producto of productos) {
            const lleno = await this.databaseService.db.orm.public.Inventario.create({
                productoId: producto.id,
                estado: 'LLENO',
                cantidad: 0,
            });

            const vacio = await this.databaseService.db.orm.public.Inventario.create({
                productoId: producto.id,
                estado: 'VACIO',
                cantidad: 0,
            });

            inventarios.push(lleno, vacio);
        }

        return inventarios;
    }
}