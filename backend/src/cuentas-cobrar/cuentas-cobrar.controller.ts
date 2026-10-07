import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { CuentasCobrarService } from './cuentas-cobrar.service.js';

const ESTADOS_VALIDOS = [
  'PENDIENTE',
  'PARCIAL',
  'PAGADA',
  'VENCIDA',
] as const;

type EstadoCuentaCobrar = (typeof ESTADOS_VALIDOS)[number];

@Controller('cuentas-cobrar')
export class CuentasCobrarController {
  constructor(
    private readonly cuentasCobrarService: CuentasCobrarService,
  ) { }

  @Get()
  findAll(
    @Query('estado') estado?: string,
  ) {
    if (!estado) {
      return this.cuentasCobrarService.findAll();
    }

    const estadoNormalizado = estado.toUpperCase();

    if (
      !ESTADOS_VALIDOS.includes(
        estadoNormalizado as EstadoCuentaCobrar,
      )
    ) {
      throw new BadRequestException(
        'Estado no válido. Use PENDIENTE, PARCIAL, PAGADA o VENCIDA',
      );
    }

    return this.cuentasCobrarService.findAll(
      estadoNormalizado as EstadoCuentaCobrar,
    );
  }
}