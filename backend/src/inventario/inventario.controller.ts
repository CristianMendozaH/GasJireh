import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import {
    InventarioService,
} from './inventario.service.js';

import {
    CreateMovimientoInventarioDto,
} from './dto/create-movimiento-inventario.dto.js';

import {
    JwtAuthGuard,
    type RequestConUsuario,
} from '../auth/guards/jwt-auth.guard.js';

@Controller('inventario')
export class InventarioController {
    constructor(
        private readonly inventarioService:
            InventarioService,
    ) { }

    // =========================================================
    // OBTENER INVENTARIO
    // =========================================================

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll() {
        return this.inventarioService.findAll();
    }

    // =========================================================
    // OBTENER HISTORIAL DE MOVIMIENTOS
    // =========================================================

    @Get('movimientos')
    @UseGuards(JwtAuthGuard)
    findMovimientos() {
        return this.inventarioService.findMovimientos();
    }

    // =========================================================
    // INICIALIZAR INVENTARIO
    // =========================================================

    @Post('inicializar')
    inicializar() {
        return this.inventarioService.inicializar();
    }

    // =========================================================
    // REGISTRAR MOVIMIENTO
    // =========================================================

    @Post('movimientos')
    @UseGuards(JwtAuthGuard)
    registrarMovimiento(
        @Body()
        dto: CreateMovimientoInventarioDto,

        @Req()
        request: RequestConUsuario,
    ) {
        return this.inventarioService.registrarMovimiento(
            dto,
            request.usuario!.sub,
        );
    }
}