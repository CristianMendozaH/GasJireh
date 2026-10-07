import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';

@Injectable()
export class ClientesService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  // =====================================================
  // CREAR CLIENTE
  // =====================================================

  async create(
    createClienteDto: CreateClienteDto,
  ) {
    return this.databaseService.db.orm.public.Cliente.create({
      nombre: createClienteDto.nombre,
      telefono: createClienteDto.telefono ?? null,
      direccion: createClienteDto.direccion ?? null,
      nit: createClienteDto.nit ?? null,
      limiteCredito: String(
        createClienteDto.limiteCredito ?? 0,
      ),
      estado: 'ACTIVO',
    });
  }

  // =====================================================
  // LISTAR CLIENTES
  // =====================================================

  async findAll() {
    return this.databaseService.db.orm.public.Cliente.all();
  }

  // =====================================================
  // ACTUALIZAR CLIENTE
  // =====================================================

  async update(
    id: number,
    datos: Partial<CreateClienteDto>,
  ) {
    // ---------------------------------------------------
    // VERIFICAR QUE EL CLIENTE EXISTA
    // ---------------------------------------------------

    const clientes =
      await this.databaseService.db.orm.public.Cliente.all();

    const cliente =
      clientes.find(
        (item) => item.id === id,
      );

    if (!cliente) {
      throw new NotFoundException(
        `No se encontró el cliente con ID ${id}`,
      );
    }

    // ---------------------------------------------------
    // PREPARAR DATOS
    // ---------------------------------------------------

    const datosActualizados: {
      nombre?: string;
      telefono?: string | null;
      direccion?: string | null;
      nit?: string | null;
      limiteCredito?: string;
    } = {};

    if (datos.nombre !== undefined) {
      datosActualizados.nombre =
        datos.nombre;
    }

    if (datos.telefono !== undefined) {
      datosActualizados.telefono =
        datos.telefono ?? null;
    }

    if (datos.direccion !== undefined) {
      datosActualizados.direccion =
        datos.direccion ?? null;
    }

    if (datos.nit !== undefined) {
      datosActualizados.nit =
        datos.nit ?? null;
    }

    if (
      datos.limiteCredito !== undefined
    ) {
      datosActualizados.limiteCredito =
        String(datos.limiteCredito);
    }

    // ---------------------------------------------------
    // ACTUALIZAR EN POSTGRESQL
    // ---------------------------------------------------

    return this.databaseService.db.orm.public.Cliente
      .where({
        id,
      })
      .update(
        datosActualizados,
      );
  }
}