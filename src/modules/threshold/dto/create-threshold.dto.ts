import { ThresholdDirection } from '../schema/threshold.schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateThresholdDTO {
  @ApiProperty()
  @IsString()
  deviceId: string;
  @ApiProperty()
  @IsString()
  householdId: string;
  @ApiProperty()
  @IsString()
  field: string;
  @ApiProperty()
  @IsNumber()
  value: number;
  @ApiProperty()
  @IsEnum(ThresholdDirection)
  direction: ThresholdDirection;
}
