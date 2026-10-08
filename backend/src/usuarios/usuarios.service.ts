import {
    BadRequestException, ConflictException, ForbiddenException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';

type Rol = 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO';
type ActualizacionUsuario = {
    nombreCompleto?: string;
    username?: string;
    rol?: Rol;
    passwordHash?: string;
    activo?: boolean;
};

@Injectable()
export class UsuariosService {
    constructor(private readonly databaseService: DatabaseService) { }

    private get modelo() {
        return this.databaseService.db.orm.public.Usuario;
    }

    private seguro<T extends { passwordHash: string }>(usuario: T) {
        const { passwordHash: _passwordHash, ...datos } = usuario;
        return datos;
    }

    private objeto(body: unknown): Record<string, unknown> {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new BadRequestException('El cuerpo de la solicitud no es válido');
        }
        return body as Record<string, unknown>;
    }

    private validarRol(valor: unknown): Rol {
        if (valor !== 'ADMINISTRADOR' && valor !== 'VENDEDOR' && valor !== 'BODEGUERO') {
            throw new BadRequestException('El rol seleccionado no es válido');
        }
        return valor;
    }

    private async buscar(id: number) {
        const usuarios = await this.modelo.all();
        const usuario = usuarios.find((u) => u.id === id);
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        return { usuario, usuarios };
    }

    private validarUltimoAdministrador(
        usuarios: Awaited<ReturnType<typeof this.modelo.all>>,
        id: number,
    ): void {
        const otros = usuarios.filter(
            (u) => u.id !== id && u.activo && u.rol === 'ADMINISTRADOR',
        );
        if (otros.length === 0) {
            throw new ForbiddenException('Debe permanecer al menos un administrador activo');
        }
    }

    // IMPORTANTE: esta llamada utiliza la firma habitual de update del ORM.
    // Verifica su compatibilidad con la versión instalada de @prisma/orm-postgres.
    private async actualizar(id: number, data: ActualizacionUsuario) {
        const usuario = await this.modelo
            .where({ id })
            .update(data);

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return this.seguro(usuario);
    }

    async findAll() {
        const usuarios = await this.modelo.all();
        return usuarios.map((u) => this.seguro(u));
    }

    async create(dto: CreateUsuarioDto) {
        const nombreCompleto = dto.nombreCompleto?.trim();
        const username = dto.username?.trim().toLowerCase();
        const password = dto.password;
        const rol = this.validarRol(dto.rol);
        if (!nombreCompleto || nombreCompleto.length > 120) {
            throw new BadRequestException('Ingresa un nombre completo válido');
        }
        if (!username || !/^[a-z0-9._-]{3,30}$/.test(username)) {
            throw new BadRequestException('El nombre de usuario no es válido');
        }
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
            throw new BadRequestException('La contraseña debe tener entre 8 y 128 caracteres');
        }
        const usuarios = await this.modelo.all();
        if (usuarios.some((u) => u.username.toLowerCase() === username)) {
            throw new ConflictException('El nombre de usuario ya está registrado');
        }
        const passwordHash = await argon2.hash(password);
        const usuario = await this.modelo.create({ nombreCompleto, username, passwordHash, rol });
        return this.seguro(usuario);
    }

    async editar(id: number, body: unknown, actorId: number) {
        const datos = this.objeto(body);
        const { usuario, usuarios } = await this.buscar(id);
        const nombreCompleto = typeof datos['nombreCompleto'] === 'string'
            ? datos['nombreCompleto'].trim() : '';
        const username = typeof datos['username'] === 'string'
            ? datos['username'].trim().toLowerCase() : '';
        const rol = this.validarRol(datos['rol']);
        if (!nombreCompleto || nombreCompleto.length > 120) {
            throw new BadRequestException('Nombre completo inválido (máximo 120 caracteres)');
        }
        if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
            throw new BadRequestException('Usuario inválido (3 a 30 caracteres)');
        }
        if (usuarios.some((u) => u.id !== id && u.username.toLowerCase() === username)) {
            throw new ConflictException('El nombre de usuario ya está registrado');
        }
        if (id === actorId && rol !== 'ADMINISTRADOR') {
            throw new ForbiddenException('No puedes quitarte tu propio rol de administrador');
        }
        if (usuario.activo && usuario.rol === 'ADMINISTRADOR' && rol !== 'ADMINISTRADOR') {
            this.validarUltimoAdministrador(usuarios, id);
        }
        return this.actualizar(id, { nombreCompleto, username, rol });
    }

    async cambiarPassword(id: number, body: unknown) {
        const datos = this.objeto(body);
        const password = datos['password'];
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
            throw new BadRequestException('La contraseña debe tener entre 8 y 128 caracteres');
        }
        await this.buscar(id);
        const passwordHash = await argon2.hash(password);
        return this.actualizar(id, { passwordHash });
    }

    async cambiarEstado(id: number, body: unknown, actorId: number) {
        const datos = this.objeto(body);
        if (typeof datos['activo'] !== 'boolean') {
            throw new BadRequestException('El estado activo debe ser verdadero o falso');
        }
        const activo = datos['activo'];
        const { usuario, usuarios } = await this.buscar(id);
        if (id === actorId && !activo) {
            throw new ForbiddenException('No puedes desactivar tu propia cuenta');
        }
        if (usuario.activo && !activo && usuario.rol === 'ADMINISTRADOR') {
            this.validarUltimoAdministrador(usuarios, id);
        }
        return this.actualizar(id, { activo });
    }
}
