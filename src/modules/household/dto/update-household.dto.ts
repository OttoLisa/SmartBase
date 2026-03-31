import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateHouseholdDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  owner?: string;

  @ApiProperty()
  @IsOptional()
  members?: string[];

  @ApiProperty()
  @IsOptional()
  viewers?: string[];
}
