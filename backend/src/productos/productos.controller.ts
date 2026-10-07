import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductosService } from './productos.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';

@Controller('productos')
export class ProductosController {
    constructor(
        private readonly productosService: ProductosService,
    ) { }

    @Get()
    findAll() {
        return this.productosService.findAll();
    }

    @Post()
    create(@Body() createProductoDto: CreateProductoDto) {
        return this.productosService.create(createProductoDto);
    }
}