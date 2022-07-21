import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { dissoc } from 'ramda';
import { Repository } from 'typeorm';


import { UserDto } from './mysql-nestjs-connector.entity';

@Injectable()
export class MysqlNestjsConnectorService {

  constructor(
    @InjectRepository(UserDto) private readonly userDtoRepository: Repository<UserDto>,
    private readonly jwtService: JwtService
  ) {}

  public async validateUser(username: string, password: string): Promise<Pick<UserDto, 'id' | 'username'>> {
    const user: UserDto = await this.userDtoRepository.findOne({username, password});

    if(user) {
      const validatedUserCleaned: Pick<UserDto, 'id' | 'username'> = dissoc<Readonly<UserDto>, 'password'>('password', user);

      return validatedUserCleaned as Readonly<Pick<UserDto, 'id' | 'username'>>;
    }

    return null;
  }

  public async login(user: UserDto) {
    const username: string = user.username;
    const password: string = user.password;

    const payload: Pick<UserDto, 'username' | 'password'> = { username, password };
    const access_token: string = this.jwtService.sign(payload);

    return {
      access_token
    };
  }
}
