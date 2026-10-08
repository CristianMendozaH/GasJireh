
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { DatabaseService } from '../../database/database.service.js';

export type RolUsuario =
    | 'ADMINISTRADOR'
    | 'VENDEDOR'
    | 'BODEGUERO';

export type JwtPayload = {
    sub: number;
    username: string;
    rol: RolUsuario;
};

export interface RequestConUsuario extends Request {
    usuario?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly databaseService: DatabaseService,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest<RequestConUsuario>();

        const token = this.extraerToken(request);

        if (!token) {
            throw new UnauthorizedException(
                'Token de acceso requerido',
            );
        }

        let payload: JwtPayload;

        try {
            payload =
                await this.jwtService.verifyAsync<JwtPayload>(token);
        } catch {
            throw new UnauthorizedException(
                'Token inválido o expirado',
            );
        }

        if (
            !Number.isInteger(payload.sub) ||
            payload.sub <= 0
        ) {
            throw new UnauthorizedException(
                'Token inválido',
            );
        }

        const usuarios =
            await this.databaseService.db.orm.public.Usuario.all();

        const usuario = usuarios.find(
            (item) => item.id === payload.sub,
        );

        if (!usuario || !usuario.activo) {
            throw new UnauthorizedException(
                'Usuario inexistente o desactivado',
            );
        }

        // Utilizar siempre los datos actuales
        // registrados en PostgreSQL.
        request.usuario = {
            sub: usuario.id,
            username: usuario.username,
            rol: usuario.rol as RolUsuario,
        };

        return true;
    }

    private extraerToken(
        request: Request,
    ): string | undefined {
        const authorization =
            request.headers.authorization;

        if (!authorization) {
            return undefined;
        }

        const [tipo, token] =
            authorization.split(' ');

        if (tipo !== 'Bearer' || !token) {
            return undefined;
        }

        return token;
    }
}
