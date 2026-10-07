import { Module } from '@nestjs/common';

import { InventarioController } from './inventario.controller.js';
import { InventarioService } from './inventario.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    InventarioController,
  ],
  providers: [
    InventarioService,
  ],
})
export class InventarioModule { }