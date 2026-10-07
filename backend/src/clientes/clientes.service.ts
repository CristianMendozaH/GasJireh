import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';

@Injectable()
export class ClientesService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  async create(createClienteDto: CreateClienteDto) {
    return this.databaseService.db.orm.public.Cliente.create({
      nombre: createClienteDto.nombre,
      telefono: createClienteDto.telefono ?? null,
      direccion: createClienteDto.direccion ?? null,
      nit: createClienteDto.nit ?? null,
      limiteCredito: String(createClienteDto.limiteCredito ?? 0),
      estado: 'ACTIVO',
    });
  }

  async findAll() {
    return this.databaseService.db.orm.public.Cliente.all();
  }
}