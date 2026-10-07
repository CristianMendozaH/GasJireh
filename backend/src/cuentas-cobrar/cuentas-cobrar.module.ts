import { Module } from '@nestjs/common';
import { CuentasCobrarService } from './cuentas-cobrar.service.js';
import { CuentasCobrarController } from './cuentas-cobrar.controller.js';

@Module({
  controllers: [CuentasCobrarController],
  providers: [CuentasCobrarService],
})
export class CuentasCobrarModule {}
