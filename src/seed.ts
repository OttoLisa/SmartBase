import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { Role, RoleDocument } from './modules/role/schema/role.schema';
import { User } from './modules/user/schema/user.schema';
import { Household } from './modules/household/schema/household.schema';
import { Device } from './modules/device/schema/device.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userModel = app.get(getModelToken(User.name));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const householdModel = app.get(getModelToken(Household.name));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const deviceModel = app.get(getModelToken(Device.name));

  const roleNames = [
    { name: 'User', description: 'Standard user with read access' },
    { name: 'Admin', description: 'Administrator with full access' },
  ];

  const roles: Record<string, RoleDocument> = {};
  for (const roleData of roleNames) {
    const existing = await roleModel.findOne({ name: roleData.name });
    if (existing) {
      console.log(`Role "${roleData.name}" already exists, skipping.`);
      roles[roleData.name] = existing;
    } else {
      const created = await roleModel.create(roleData);
      console.log(`Created role "${roleData.name}".`);
      roles[roleData.name] = created;
    }
  }

  const email = 'dhbw@smartbase.de';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  let user = await userModel.findOne({ email });
  if (user) {
    console.log(`User "${email}" already exists, skipping.`);
  } else {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('SmartbaseAdminPasswort!', salt);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    user = await userModel.create({
      firstName: 'DHBW',
      lastName: 'Admin',
      email,
      password: hashedPassword,
      isActive: true,
      roles: [roles['User']._id, roles['Admin']._id],
    });
    console.log(`Created user "${email}".`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  let household = await householdModel.findOne({
    name: 'Example',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    owner: user._id,
  });
  if (household) {
    console.log(`Household "Example" already exists, skipping.`);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    household = await householdModel.create({
      name: 'Example',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      owner: user._id,
      members: [],
      viewers: [],
    });
    console.log(`Created household "Example".`);
  }

  const devicesData = [
    {
      name: 'Temperatur-Sensor Wohnzimmer',
      type: 'temperature',
      location: 'Wohnzimmer',
      ip: '192.168.1.101',
      macAddress: 'AA:BB:CC:DD:EE:01',
    },
    {
      name: 'Luftfeuchte-Sensor Schlafzimmer',
      type: 'humidity',
      location: 'Schlafzimmer',
      ip: '192.168.1.102',
      macAddress: 'AA:BB:CC:DD:EE:02',
    },
    {
      name: 'CO2-Sensor Küche',
      type: 'co2',
      location: 'Küche',
      ip: '192.168.1.103',
      macAddress: 'AA:BB:CC:DD:EE:03',
    },
  ];

  for (const deviceData of devicesData) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const existing = await deviceModel.findOne({
      macAddress: deviceData.macAddress,
    });
    if (existing) {
      console.log(`Device "${deviceData.name}" already exists, skipping.`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      await deviceModel.create({ ...deviceData, household: household._id });
      console.log(`Created device "${deviceData.name}" (${deviceData.ip}).`);
    }
  }

  console.log('\nSeeding completed successfully.');
  await app.close();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
