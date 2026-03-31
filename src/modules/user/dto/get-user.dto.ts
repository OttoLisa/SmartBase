import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../schema/user.schema';

export class GetUserDto {
  constructor(user: UserDocument | null) {
    if (!user) {
      return;
    }

    this.id = user._id.toString();
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.version = user.__v;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.roles = user.roles.map((role) => role.name);
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty()
  version: number;
  @ApiProperty()
  roles: string[];
}
