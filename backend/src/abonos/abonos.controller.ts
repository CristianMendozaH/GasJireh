import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { AbonosService } from './abonos.service.js';
import { CreateAbonoDto } from './dto/create-abono.dto.js';

@Controller('abonos')
export class AbonosController {
  constructor(
    private readonly abonosService: AbonosService,
  ) { }

  @Get()
  findAll() {
    return this.abonosService.findAll();
  }

  @Post()
  create(
    @Body() createAbonoDto: CreateAbonoDto,
  ) {
    // Temporalmente usamos el usuario 1.
    // Después vendrá del JWT.
    const usuarioId = 1;

    return this.abonosService.create(
      createAbonoDto,
      usuarioId,
    );
  }
}