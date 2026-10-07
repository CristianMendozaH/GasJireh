import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { CreateAbonoDto } from './dto/create-abono.dto.js';

@Injectable()
export class AbonosService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  async findAll() {
    return this.databaseService.db.orm.public.Abono.all();
  }

  async create(
    createAbonoDto: CreateAbonoDto,
    usuarioId: number,
  ) {
    const { cuentaCobrarId, monto, observacion } = createAbonoDto;

    // 1. Validar monto
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new BadRequestException(
        'El monto del abono debe ser mayor que 0',
      );
    }

    // 2. Buscar cuenta por cobrar
    const cuentaCobrar =
      await this.databaseService.db.orm.public.CuentaCobrar
        .where({ id: cuentaCobrarId })
        .first();

    if (!cuentaCobrar) {
      throw new NotFoundException(
        'Cuenta por cobrar no encontrada',
      );
    }

    // 3. Validar que todavía tenga saldo
    const saldoActual = Number(cuentaCobrar.saldoPendiente);

    if (saldoActual <= 0 || cuentaCobrar.estado === 'PAGADA') {
      throw new BadRequestException(
        'Esta cuenta ya se encuentra pagada',
      );
    }

    // 4. Evitar pagar más de lo adeudado
    if (monto > saldoActual) {
      throw new BadRequestException(
        `El abono no puede superar el saldo pendiente de Q${saldoActual.toFixed(2)}`,
      );
    }

    // 5. Calcular nuevo saldo y estado
    const nuevoSaldo = Number(
      (saldoActual - monto).toFixed(2),
    );

    const nuevoEstado =
      nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL';

    // 6. Crear abono
    const abono =
      await this.databaseService.db.orm.public.Abono.create({
        cuentaCobrarId,
        usuarioId,
        monto: monto.toFixed(2),
        observacion: observacion ?? null,
      });

    // 7. Actualizar cuenta por cobrar
    const cuentaActualizada =
      await this.databaseService.db.orm.public.CuentaCobrar
        .where({ id: cuentaCobrarId })
        .update({
          saldoPendiente: nuevoSaldo.toFixed(2),
          estado: nuevoEstado,
        });

    return {
      mensaje: 'Abono registrado correctamente',
      abono,
      cuentaCobrar: cuentaActualizada,
    };
  }
}