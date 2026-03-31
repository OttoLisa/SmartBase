import { DeviceDocument } from '../schema/device.schema';

export class GetDeviceDto {
  constructor(device: DeviceDocument | null) {
    if (!device) {
      throw new Error('Device not found');
    }

    this.id = device._id.toString();
    this.name = device.name;
    this.type = device.type;
    this.location = device.location;
    this.ip = device.ip;
    this.macAddress = device.macAddress;
  }

  id: string;
  name: string;
  type: string;
  location: string;
  ip: string;
  macAddress: string;
}
