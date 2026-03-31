import { GetUserDto } from '../../user/dto/get-user.dto';
import { HouseholdPopulated } from '../schema/household.schema';

export class GetHouseholdDto {
  constructor(household: HouseholdPopulated | null) {
    if (!household) {
      throw new Error('Household not found');
    }

    this.id = household._id.toString();
    this.name = household.name;
    this.owner = new GetUserDto(household.owner);
    this.members = household.members.map((member) => new GetUserDto(member));
    this.viewers = household.viewers.map((viewer) => new GetUserDto(viewer));
  }

  id: string;
  name: string;
  owner: GetUserDto;
  members: GetUserDto[];
  viewers: GetUserDto[];

}
