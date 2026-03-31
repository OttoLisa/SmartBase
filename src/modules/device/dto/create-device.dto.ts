import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsMACAddress, IsString } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsIP('4')
  ip: string;

  @ApiProperty()
  @IsMACAddress()
  macAddress: string;

  @ApiProperty()
  @IsString()
  household: string;
}
