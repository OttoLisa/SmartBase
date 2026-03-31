import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class MemberActionDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
