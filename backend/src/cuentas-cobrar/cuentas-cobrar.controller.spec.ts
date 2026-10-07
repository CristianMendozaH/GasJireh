import { Test, TestingModule } from '@nestjs/testing';
import { CuentasCobrarController } from './cuentas-cobrar.controller.js';
import { CuentasCobrarService } from './cuentas-cobrar.service.js';

describe('CuentasCobrarController', () => {
  let controller: CuentasCobrarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuentasCobrarController],
      providers: [CuentasCobrarService],
    }).compile();

    controller = module.get<CuentasCobrarController>(CuentasCobrarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
