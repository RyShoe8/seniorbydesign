import { seedDatabase } from '../lib/seed';

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();

