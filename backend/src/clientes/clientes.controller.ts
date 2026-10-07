import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ClientesService } from './clientes.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
  ) { }

  // =====================================================
  // CREAR CLIENTE
  // =====================================================

  @Post()
  create(
    @Body() createClienteDto: CreateClienteDto,
  ) {
    return this.clientesService.create(
      createClienteDto,
    );
  }

  // =====================================================
  // LISTAR CLIENTES
  // =====================================================

  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  // =====================================================
  // ACTUALIZAR CLIENTE
  // =====================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: Partial<CreateClienteDto>,
  ) {
    return this.clientesService.update(
      id,
      datos,
    );
  }
}