
import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';

import {
    JwtAuthGuard,
    type RequestConUsuario,
} from '../auth/guards/jwt-auth.guard.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
    constructor(
        private readonly usuariosService: UsuariosService,
    ) { }

    private verificarAdministrador(
        request: RequestConUsuario,
    ): void {
        if (request.usuario?.rol !== 'ADMINISTRADOR') {
            throw new ForbiddenException(
                'Solo el administrador puede gestionar usuarios',
            );
        }
    }

    @Get()
    findAll(
        @Req() request: RequestConUsuario,
    ) {
        this.verificarAdministrador(request);

        return this.usuariosService.findAll();
    }

    @Post()
    create(
        @Body() createUsuarioDto: CreateUsuarioDto,
        @Req() request: RequestConUsuario,
    ) {
        this.verificarAdministrador(request);

        return this.usuariosService.create(createUsuarioDto);
    }
}
