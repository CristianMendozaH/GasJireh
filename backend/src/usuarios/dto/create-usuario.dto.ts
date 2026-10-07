export class CreateUsuarioDto {
    nombreCompleto: string;
    username: string;
    password: string;
    rol: 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO';
}