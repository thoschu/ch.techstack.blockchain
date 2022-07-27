import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MysqlNestjsConnectorModule, UserDto } from '@ch.techstack.blockchain/mysql-nestjs-connector';

import { SignOptions, verify, JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { and, has } from 'ramda';

import { AuthService } from './auth.service';
import DoneCallback = jest.DoneCallback;

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;
  const secret = 'secret';
  const mysql: TypeOrmModuleOptions = {
    port: 3306,
    url: 'localhost',
    database: 'Blockchain',
    username: 'root',
    password: 'password'
  };

  beforeEach(async () => {
    const signOptions: SignOptions = { expiresIn: '1h' };
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
      providers: [AuthService]
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validateUser - xxx', async () => {
    const username = 'thoschu';
    const password = 'password';
    const validateUserResult = await service.validateUser(username, password);
    // const hasAccess_tokenFn: (obj: unknown) => boolean = has<'access_token'>('access_token');
    // const hasAccess_token: boolean = hasAccess_tokenFn(access_tokenResult);

    console.log(validateUserResult);

    // expect(hasAccess_token).toBeTruthy();
  });

  it('login - { access_token: string; }', async () => {
    const username = 'thoschu';
    const password = 'password';
    const access_tokenResult: { access_token: string; } = await service.login({id: 0, username, password});
    const hasAccess_tokenFn: (obj: unknown) => boolean = has<'access_token'>('access_token');
    const hasAccess_token: boolean = hasAccess_tokenFn(access_tokenResult);

    expect(hasAccess_token).toBeTruthy();
  });

  it('is valid access token',(done: DoneCallback) => {
    const username = 'thoschu';
    const password = 'password';
    const access_tokenResultPromise:  Promise<{ access_token: string; }> = service.login({id: 0, username, password});

    access_tokenResultPromise.then((access_tokenResult: { access_token: string; }) => {
      const access_token: string = access_tokenResult.access_token;
      const hasUsernameFn: (obj: unknown) => boolean = has<'username'>('username');
      const hasPasswordFn: (obj: unknown) => boolean = has<'password'>('password');

      const hasIatFn: (obj: unknown) => boolean = has<'iat'>('iat');
      const hasExpFn: (obj: unknown) => boolean = has<'exp'>('exp');

      verify(access_token, secret,(err: VerifyErrors, decoded: JwtPayload ) => {
        const hasUsername: boolean = hasUsernameFn(decoded);
        const hasPassword: boolean = hasPasswordFn(decoded);
        const hasIat: boolean = hasIatFn(decoded);
        const hasExp: boolean = hasExpFn(decoded);
        const isValidAccessToken: boolean = hasUsername && hasPassword && hasIat && hasExp;

        expect(isValidAccessToken).toBeTruthy();

        done();
      });
    });
  });
});
