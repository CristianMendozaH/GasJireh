import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type JwtPayload = {
    sub: number;
    username: string;
    rol: 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO';
};

export interface RequestConUsuario extends Request {
    usuario?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest<RequestConUsuario>();

        const token = this.extraerToken(request);

        if (!token) {
            throw new UnauthorizedException('Token de acceso requerido');
        }

        try {
            const payload =
                await this.jwtService.verifyAsync<JwtPayload>(token);

            request.usuario = payload;

            return true;
        } catch {
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }

    private extraerToken(request: Request): string | undefined {
        const authorization = request.headers.authorization;

        if (!authorization) {
            return undefined;
        }

        const [tipo, token] = authorization.split(' ');

        return tipo === 'Bearer' ? token : undefined;
    }
}