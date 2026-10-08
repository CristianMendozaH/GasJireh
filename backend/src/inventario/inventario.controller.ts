
import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { InventarioService } from './inventario.service.js';

import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto.js';

import {
    JwtAuthGuard,
    type RequestConUsuario,
} from '../auth/guards/jwt-auth.guard.js';

@Controller('inventario')
@UseGuards(JwtAuthGuard)
export class InventarioController {
    constructor(
        private readonly inventarioService: InventarioService,
    ) { }

    // ==========================================
    // CONSULTAR INVENTARIO
    // ==========================================

    @Get()
    findAll() {
        return this.inventarioService.findAll();
    }

    // ==========================================
    // CONSULTAR HISTORIAL DE MOVIMIENTOS
    // ==========================================

    @Get('movimientos')
    findMovimientos() {
        return this.inventarioService.findMovimientos();
    }

    // ==========================================
    // INICIALIZAR INVENTARIO
    // SOLO ADMINISTRADOR
    // ==========================================

    @Post('inicializar')
    inicializar(
        @Req() request: RequestConUsuario,
    ) {
        const usuario = request.usuario!;

        if (usuario.rol !== 'ADMINISTRADOR') {
            throw new ForbiddenException(
                'Solo el administrador puede inicializar el inventario',
            );
        }

        return this.inventarioService.inicializar();
    }

    // ==========================================
    // REGISTRAR MOVIMIENTO MANUAL
    // ADMINISTRADOR Y BODEGUERO
    // ==========================================

    @Post('movimientos')
    registrarMovimiento(
        @Body() dto: CreateMovimientoInventarioDto,
        @Req() request: RequestConUsuario,
    ) {
        const usuario = request.usuario!;

        if (
            usuario.rol !== 'ADMINISTRADOR' &&
            usuario.rol !== 'BODEGUERO'
        ) {
            throw new ForbiddenException(
                'No tienes permisos para registrar movimientos de inventario',
            );
        }

        return this.inventarioService.registrarMovimiento(
            dto,
            usuario.sub,
        );
    }
}
