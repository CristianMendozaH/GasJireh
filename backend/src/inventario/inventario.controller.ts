import {
    Controller,
    Get,
    Post,
    UseGuards,
} from '@nestjs/common';
import { InventarioService } from './inventario.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('inventario')
export class InventarioController {
    constructor(
        private readonly inventarioService: InventarioService,
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll() {
        return this.inventarioService.findAll();
    }

    @Post('inicializar')
    inicializar() {
        return this.inventarioService.inicializar();
    }
}