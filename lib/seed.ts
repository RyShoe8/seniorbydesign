import bcrypt from 'bcryptjs';
import { getUsersCollection } from './db';

export async function seedDatabase() {
  const usersCollection = await getUsersCollection();

  const adminUsers = [
    {
      email: 'ryanschumacher@themediashop.co',
      password: await bcrypt.hash('temp_password_123', 10),
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'kellymcguire@themediashop.co',
      password: await bcrypt.hash('temp_password_123', 10),
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'Glenn@sbdid.com',
      password: await bcrypt.hash('temp_password_123', 10),
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const user of adminUsers) {
    const existingUser = await usersCollection.findOne({ email: user.email });
    if (!existingUser) {
      await usersCollection.insertOne(user);
      console.log(`Created admin user: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }
}





