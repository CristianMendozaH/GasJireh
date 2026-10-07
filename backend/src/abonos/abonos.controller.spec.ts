import { Test, TestingModule } from '@nestjs/testing';
import { AbonosController } from './abonos.controller.js';
import { AbonosService } from './abonos.service.js';

describe('AbonosController', () => {
  let controller: AbonosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbonosController],
      providers: [AbonosService],
    }).compile();

    controller = module.get<AbonosController>(AbonosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
