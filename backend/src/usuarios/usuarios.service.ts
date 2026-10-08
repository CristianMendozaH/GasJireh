
import {
    BadRequestException,
    ConflictException,
    Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { DatabaseService } from '../database/database.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';

@Injectable()
export class UsuariosService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) { }

    async findAll() {
        const usuarios =
            await this.databaseService.db.orm.public.Usuario.all();

        return usuarios.map(
            ({ passwordHash, ...usuario }) => usuario,
        );
    }

    async create(createUsuarioDto: CreateUsuarioDto) {
        const nombreCompleto =
            createUsuarioDto.nombreCompleto?.trim();

        const username =
            createUsuarioDto.username?.trim().toLowerCase();

        const password = createUsuarioDto.password;
        const rol = createUsuarioDto.rol;

        if (!nombreCompleto || nombreCompleto.length > 120) {
            throw new BadRequestException(
                'Ingresa un nombre completo válido',
            );
        }

        if (
            !username ||
            !/^[a-z0-9._-]{3,30}$/.test(username)
        ) {
            throw new BadRequestException(
                'El nombre de usuario no es válido',
            );
        }

        if (
            typeof password !== 'string' ||
            password.length < 8 ||
            password.length > 128
        ) {
            throw new BadRequestException(
                'La contraseña debe tener entre 8 y 128 caracteres',
            );
        }

        if (
            !['ADMINISTRADOR', 'VENDEDOR', 'BODEGUERO']
                .includes(rol)
        ) {
            throw new BadRequestException(
                'El rol seleccionado no es válido',
            );
        }

        const usuarios =
            await this.databaseService.db.orm.public.Usuario.all();

        const existe = usuarios.some(
            (usuario) =>
                usuario.username.toLowerCase() === username,
        );

        if (existe) {
            throw new ConflictException(
                'El nombre de usuario ya está registrado',
            );
        }

        const passwordHash = await argon2.hash(password);

        const usuario =
            await this.databaseService.db.orm.public.Usuario.create({
                nombreCompleto,
                username,
                passwordHash,
                rol,
            });

        const { passwordHash: _, ...usuarioSeguro } = usuario;

        return usuarioSeguro;
    }
}
