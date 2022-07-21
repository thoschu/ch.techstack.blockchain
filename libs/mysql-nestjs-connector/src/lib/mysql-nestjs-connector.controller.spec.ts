import { Test, TestingModule } from '@nestjs/testing';
import { MysqlNestjsConnectorController } from './mysql-nestjs-connector.controller';

describe('MysqlNestjsConnectorController', () => {
  let controller: MysqlNestjsConnectorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MysqlNestjsConnectorController],
    }).compile();

    controller = module.get<MysqlNestjsConnectorController>(
      MysqlNestjsConnectorController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
