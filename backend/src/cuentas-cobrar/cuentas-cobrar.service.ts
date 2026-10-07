import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

type EstadoCuentaCobrar =
  | 'PENDIENTE'
  | 'PARCIAL'
  | 'PAGADA'
  | 'VENCIDA';

@Injectable()
export class CuentasCobrarService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  async findAll(estado?: EstadoCuentaCobrar) {
    const cuentas =
      await this.databaseService.db.orm.public.CuentaCobrar.all();

    const ventas =
      await this.databaseService.db.orm.public.Venta.all();

    const clientes =
      await this.databaseService.db.orm.public.Cliente.all();

    const abonos =
      await this.databaseService.db.orm.public.Abono.all();

    const ahora = new Date();

    const resultado = cuentas.map((cuenta) => {
      const venta = ventas.find(
        (item) => item.id === cuenta.ventaId,
      );

      const cliente = venta?.clienteId
        ? clientes.find(
          (item) => item.id === venta.clienteId,
        )
        : null;

      const abonosCuenta = abonos.filter(
        (item) => item.cuentaCobrarId === cuenta.id,
      );

      const totalAbonado = abonosCuenta.reduce(
        (acumulado, abono) =>
          acumulado + Number(abono.monto),
        0,
      );

      const saldoPendiente = Number(cuenta.saldoPendiente);

      let estadoCalculado: EstadoCuentaCobrar =
        cuenta.estado as EstadoCuentaCobrar;

      /*
       * Si todavía existe saldo y ya pasó la fecha de
       * vencimiento, la cuenta se considera vencida.
       *
       * No modificamos PostgreSQL aquí; solamente calculamos
       * el estado real para la consulta.
       */
      if (
        saldoPendiente > 0 &&
        cuenta.fechaVencimiento &&
        new Date(cuenta.fechaVencimiento) < ahora
      ) {
        estadoCalculado = 'VENCIDA';
      }

      return {
        id: cuenta.id,

        cliente: cliente
          ? {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
          }
          : null,

        venta: venta
          ? {
            id: venta.id,
            tipo: venta.tipo,
            total: venta.total,
            creadoEn: venta.creadoEn,
          }
          : null,

        montoOriginal: cuenta.montoOriginal,
        totalAbonado: totalAbonado.toFixed(2),
        saldoPendiente: cuenta.saldoPendiente,

        estado: estadoCalculado,

        fechaVencimiento: cuenta.fechaVencimiento,
        cantidadAbonos: abonosCuenta.length,

        creadoEn: cuenta.creadoEn,
        actualizadoEn: cuenta.actualizadoEn,
      };
    });

    if (estado) {
      return resultado.filter(
        (cuenta) => cuenta.estado === estado,
      );
    }

    return resultado;
  }
}