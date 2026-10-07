import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { VentasService } from './ventas.service.js';
import { CreateVentaDto } from './dto/create-venta.dto.js';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
  ) { }

  @Post()
  create(
    @Body() createVentaDto: CreateVentaDto,
  ) {
    // Temporalmente usamos el usuario administrador ID 1.
    // Después vendrá desde el JWT.
    const usuarioId = 1;

    return this.ventasService.create(
      createVentaDto,
      usuarioId,
    );
  }

  @Get()
  findAll() {
    return this.ventasService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ventasService.findOne(id);
  }

  @Patch(':id/anular')
  anular(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Temporalmente usamos el usuario administrador ID 1.
    // Después vendrá desde el JWT.
    const usuarioId = 1;

    return this.ventasService.anular(
      id,
      usuarioId,
    );
  }
}