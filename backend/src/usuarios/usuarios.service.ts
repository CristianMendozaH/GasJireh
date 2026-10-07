import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';

@Injectable()
export class UsuariosService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) { }

    async findAll() {
        const usuarios = await this.databaseService.db.orm.public.Usuario.all();

        return usuarios.map(({ passwordHash, ...usuario }) => usuario);
    }

    async create(createUsuarioDto: CreateUsuarioDto) {
        const passwordHash = await argon2.hash(createUsuarioDto.password);

        const usuario = await this.databaseService.db.orm.public.Usuario.create({
            nombreCompleto: createUsuarioDto.nombreCompleto,
            username: createUsuarioDto.username,
            passwordHash,
            rol: createUsuarioDto.rol,
        });

        const { passwordHash: _, ...usuarioSeguro } = usuario;

        return usuarioSeguro;
    }
}