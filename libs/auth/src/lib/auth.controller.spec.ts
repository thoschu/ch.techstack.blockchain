import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

import { MysqlNestjsConnectorModule, MysqlNestjsConnectorService, UserDto } from '@ch.techstack.blockchain/mysql-nestjs-connector';

import { SignOptions } from 'jsonwebtoken';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let module: TestingModule;
  let controller: AuthController;
  const mysql: TypeOrmModuleOptions = {
    port: 3306,
    url: 'localhost',
    database: 'Blockchain',
    username: 'root',
    password: 'password'
  };

  beforeEach(async () => {
    const signOptions: SignOptions = { expiresIn: '1h' };
    const secret = 'secret';
    const jwtModuleOptions: JwtModuleOptions = { secret, signOptions };

    const options: TypeOrmModuleOptions = {
      type: 'mysql',
      host: mysql.url,
      port: mysql.port,
      username: mysql.username,
      password: mysql.password,
      database: mysql.database,
      entities: [],
      synchronize: false,
      keepConnectionAlive: true
    };

    module = await Test.createTestingModule({
      imports: [
        MysqlNestjsConnectorModule.forRoot(options),
        TypeOrmModule.forFeature([UserDto]),
        JwtModule.register(jwtModuleOptions)
      ],
      controllers: [AuthController],
      providers: [
        AuthService, MysqlNestjsConnectorService
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login ', () => {
    const id = 1;
    const username = 'thoschu';
    const password = 'password';
    const user: UserDto = { id, username, password };

    // const zzz = controller.login(user);
    // console.log(zzz);

    // expect(controller).toBeDefined();
  });
});
