import { ApiProperty } from '@nestjs/swagger';

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('User')
export class UserDto {
  @ApiProperty({
    description: 'id - primary key',
    example: '1'
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
    example: '*****'
  })
  @Column()
  public password: string;
}
