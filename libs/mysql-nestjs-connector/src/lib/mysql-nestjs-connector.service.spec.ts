import { Test } from '@nestjs/testing';
import { MysqlNestjsConnectorService } from './mysql-nestjs-connector.service';

describe('MysqlNestjsConnectorService', () => {
  let service: MysqlNestjsConnectorService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MysqlNestjsConnectorService],
    }).compile();

    service = module.get(MysqlNestjsConnectorService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
