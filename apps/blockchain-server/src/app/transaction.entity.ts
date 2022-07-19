import { ApiProperty } from '@nestjs/swagger';

import { ITransaction } from '@ch.techstack.blockchain/blockchain-interface';

export class CreateTransactionDto implements ITransaction {
  @ApiProperty({
    description: 'payload - Nutzdaten der Transaction',
    example: 'Tom S.'
  })
  public payload: string;

  @ApiProperty({
    description: 'sender - Absender',
    example: 'Max Mustermann'
  })
  public sender: string;

  @ApiProperty({
    description: 'recipient - Empfänger',
    example: 'Max Musterfrau'
  })
  public recipient: string;
}
