import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { UserDto } from '@ch.techstack.blockchain/mysql-nestjs-connector';

import { dissoc } from 'ramda';
import { Repository } from 'typeorm';

type CleanUserDto = Pick<UserDto, 'id' | 'username'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserDto) private readonly userDtoRepository: Repository<UserDto>,
    private readonly jwtService: JwtService
  ) {}

  public async validateUser(username: string, password: string): Promise<CleanUserDto> {
    const user: UserDto = await this.userDtoRepository.findOne({username, password});

    console.log(this.userDtoRepository);

    if(user) {
      const validatedUserCleaned: CleanUserDto = dissoc<Readonly<UserDto>, 'password'>('password', user);

      return validatedUserCleaned as Readonly<CleanUserDto>;
    }

    return null;
  }

  public async login(user: UserDto): Promise<{ 'access_token': string; }> {
    const username: string = user.username;
    const password: string = user.password;
    const payload: Pick<UserDto, 'username' | 'password'> = { username, password };
    const access_token: string = this.jwtService.sign(payload);

    return {
      access_token
    };
  }
}
