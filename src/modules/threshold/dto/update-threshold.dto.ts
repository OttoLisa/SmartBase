import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateThresholdDto {
  @ApiProperty()
  @IsNumber()
  value: number;
}
