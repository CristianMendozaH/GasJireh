
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';

import { VentasService } from './ventas.service.js';
import { CreateVentaDto } from './dto/create-venta.dto.js';

import {
  JwtAuthGuard,
  type RequestConUsuario,
} from '../auth/guards/jwt-auth.guard.js';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
  ) { }

  // ==========================================
  // REGISTRAR VENTA
  // ==========================================

  @Post()
  create(
    @Body() createVentaDto: CreateVentaDto,
    @Req() request: RequestConUsuario,
  ) {
    const usuario = request.usuario!;

    if (
      usuario.rol !== 'ADMINISTRADOR' &&
      usuario.rol !== 'VENDEDOR'
    ) {
      throw new ForbiddenException(
        'No tienes permisos para registrar ventas',
      );
    }

    return this.ventasService.create(
      createVentaDto,
      usuario.sub,
    );
  }

  // ==========================================
  // LISTAR VENTAS
  // ==========================================

  @Get()
  findAll() {
    return this.ventasService.findAll();
  }

  // ==========================================
  // CONSULTAR VENTA
  // ==========================================

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ventasService.findOne(id);
  }

  // ==========================================
  // ANULAR VENTA
  // ==========================================

  @Patch(':id/anular')
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestConUsuario,
  ) {
    const usuario = request.usuario!;

    if (usuario.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Solo el administrador puede anular ventas',
      );
    }

    return this.ventasService.anular(
      id,
      usuario.sub,
    );
  }
}
