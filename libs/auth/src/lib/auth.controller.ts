import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { UserDto } from '@ch.techstack.blockchain/mysql-nestjs-connector';

import { AuthService } from './auth.service';

@ApiTags('Auth methods')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOkResponse({ description: 'Login successful or not...' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() user: UserDto, ): Promise<{ 'access_token': string; }> {
    const validUser: Pick<UserDto, 'id' | 'username'> = await this.authService.validateUser(user.username, user.password);
    const className: string = this.constructor.name;
    const httpCode: HttpStatus = validUser ? HttpStatus.OK : HttpStatus.UNAUTHORIZED;

    Logger.log(`/v1/auth/login ${httpCode} - ${JSON.stringify(validUser)} `, className, true);

    if (validUser) {
      return this.authService.login(user);
    } else {
      throw new UnauthorizedException();
    }
  }
}
