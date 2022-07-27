import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserDto } from '@ch.techstack.blockchain/mysql-nestjs-connector';

import { SignOptions } from 'jsonwebtoken';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {
  private static readonly signOptions: SignOptions = { expiresIn: '1h' };

  public static forRoot(secret: string): DynamicModule {
    const jwtModuleOptions: JwtModuleOptions = {
      secret: secret,
      signOptions: AuthModule.signOptions
    };

    return {
      module: AuthModule,
      imports: [
        PassportModule,
        TypeOrmModule.forFeature([UserDto]),
        JwtModule.register(jwtModuleOptions)
      ]
    };
  }
}
