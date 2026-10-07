import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const usuarios = await this.databaseService.db.orm.public.Usuario.all();

        const usuario = usuarios.find(
            (usuario) => usuario.username === loginDto.username,
        );

        if (!usuario || !usuario.activo) {
            throw new UnauthorizedException('Usuario o contraseña incorrectos');
        }

        const passwordValido = await argon2.verify(
            usuario.passwordHash,
            loginDto.password,
        );

        if (!passwordValido) {
            throw new UnauthorizedException('Usuario o contraseña incorrectos');
        }

        const payload = {
            sub: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            usuario: {
                id: usuario.id,
                nombreCompleto: usuario.nombreCompleto,
                username: usuario.username,
                rol: usuario.rol,
            },
        };
    }
}