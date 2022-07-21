import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';

import { MysqlNestjsConnectorService } from './mysql-nestjs-connector.service';
import { UserDto } from './mysql-nestjs-connector.entity';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth methods')
@Controller('v1/auth')
export class MysqlNestjsConnectorController {
  constructor(private readonly mysqlNestjsConnectorService: MysqlNestjsConnectorService) {
  }

  @ApiOkResponse({ description: 'Login successful or not...' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() user: UserDto): Promise<unknown> {
    const validUser = await this.mysqlNestjsConnectorService.validateUser(user.username, user.password);

    if (validUser) {
      return this.mysqlNestjsConnectorService.login(user);
    } else {
      throw new UnauthorizedException();
    }
  }
}
