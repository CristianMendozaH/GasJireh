import { PartialType } from '@nestjs/mapped-types';
import { CreateCuentasCobrarDto } from './create-cuentas-cobrar.dto.js';

export class UpdateCuentasCobrarDto extends PartialType(CreateCuentasCobrarDto) {}
