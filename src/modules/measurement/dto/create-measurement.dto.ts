import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateMeasurementDto {
  @ApiProperty()
  @IsNotEmpty()
  payload: Record<string, unknown>;
}
