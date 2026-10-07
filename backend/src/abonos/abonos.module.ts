import { Module } from '@nestjs/common';
import { AbonosService } from './abonos.service.js';
import { AbonosController } from './abonos.controller.js';

@Module({
  controllers: [AbonosController],
  providers: [AbonosService],
})
export class AbonosModule {}
