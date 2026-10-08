
import {
    IsIn,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    nombreCompleto!: string;

    @IsString()
    @Matches(/^[a-z0-9._-]{3,30}$/, {
        message:
            'El usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, puntos, guiones o guion bajo',
    })
    username!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;

    @IsIn(['ADMINISTRADOR', 'VENDEDOR', 'BODEGUERO'])
    rol!: 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO';
}
