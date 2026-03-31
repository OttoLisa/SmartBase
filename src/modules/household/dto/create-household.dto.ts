import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
  @ApiProperty()
  @IsArray()
  @IsOptional()
  members?: string[];
  @ApiProperty()
  @IsArray()
  @IsOptional()
  viewers?: string[];
}
