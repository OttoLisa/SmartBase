import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdController } from './threshold.controller';
import { ThresholdService } from './threshold.service';

describe('ThresholdController', () => {
  let controller: ThresholdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThresholdController],
      providers: [ThresholdService],
    }).compile();

    controller = module.get<ThresholdController>(ThresholdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
