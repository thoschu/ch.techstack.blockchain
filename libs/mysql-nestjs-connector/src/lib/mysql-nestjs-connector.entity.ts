import { ApiProperty } from '@nestjs/swagger';

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('User')
export class UserDto {
  @ApiProperty({
    description: 'id',
    example: 'Tom S.'
  })
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiProperty({
    description: 'username',
    example: 'Max Mustermann'
  })
  @Column()
  public username: string;

  @ApiProperty({
    description: 'password',
    example: 'foobar'
  })
  @Column()
  public password: string;
}
