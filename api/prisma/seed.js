const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed the database...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create mock users
  const users = [
    // Buyers
    {
      email: 'john.doe@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'BUYER'
    },
    {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'BUYER'
    },
    {
      email: 'mike.johnson@example.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'BUYER'
    },
    {
      email: 'sarah.wilson@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'BUYER'
    },
    // Sellers
    {
      email: 'alex.store@example.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Store',
      role: 'SELLER'
    },
    {
      email: 'emma.shop@example.com',
      password: hashedPassword,
      firstName: 'Emma',
      lastName: 'Shop',
      role: 'SELLER'
    },
    {
      email: 'david.market@example.com',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Market',
      role: 'SELLER'
    },
    {
      email: 'lisa.boutique@example.com',
      password: hashedPassword,
      firstName: 'Lisa',
      lastName: 'Boutique',
      role: 'SELLER'
    }
  ];

  // Clear existing users
  console.log('🧹 Clearing existing users...');
  await prisma.user.deleteMany({});

  // Create users
  console.log('👥 Creating mock users...');
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    console.log(`✅ Created ${user.role.toLowerCase()}: ${user.firstName} ${user.lastName} (${user.email})`);
  }

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Test accounts created:');
  console.log('All accounts use password: password123');
  console.log('');
  console.log('🛒 Buyers:');
  console.log('  - john.doe@example.com');
  console.log('  - jane.smith@example.com');
  console.log('  - mike.johnson@example.com');
  console.log('  - sarah.wilson@example.com');
  console.log('');
  console.log('🏪 Sellers:');
  console.log('  - alex.store@example.com');
  console.log('  - emma.shop@example.com');
  console.log('  - david.market@example.com');
  console.log('  - lisa.boutique@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
