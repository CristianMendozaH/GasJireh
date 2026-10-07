import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { ProductosModule } from './productos/productos.module.js';
import { InventarioModule } from './inventario/inventario.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { VentasModule } from './ventas/ventas.module.js';
import { CuentasCobrarModule } from './cuentas-cobrar/cuentas-cobrar.module.js';
import { AbonosModule } from './abonos/abonos.module.js';

@Module({
  imports: [
    DatabaseModule,
    ProductosModule,
    InventarioModule,
    UsuariosModule,
    AuthModule,
    ClientesModule,
    VentasModule,
    CuentasCobrarModule,
    AbonosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }