const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const { processAllPDFs } = require('../src/utils/pdfProcessor');
const { storeDocument } = require('../src/services/documentService');

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

  // Process PDF files and store in database
  console.log('📄 Processing PDF files...');
  const pdfDirectory = path.join(__dirname, '../../web/public/assets/pdf');
  
  try {
    const processedPDFs = await processAllPDFs(pdfDirectory);
    
    if (processedPDFs.length > 0) {
      console.log(`📚 Found ${processedPDFs.length} PDF files to process`);
      
      // Clear existing documents
      await prisma.document.deleteMany({});
      console.log('🧹 Cleared existing documents');
      
      // Store processed PDFs in database
      for (const pdfData of processedPDFs) {
        try {
          await storeDocument({
            filename: pdfData.filename,
            title: pdfData.title,
            content: pdfData.content,
            filePath: pdfData.filePath,
            uploadedBy: 'system' // System user for seeded documents
          });
          console.log(`✅ Stored document: ${pdfData.filename}`);
        } catch (error) {
          console.error(`❌ Failed to store ${pdfData.filename}:`, error.message);
        }
      }
    } else {
      console.log('📄 No PDF files found in the assets/pdf directory');
      console.log('💡 Place PDF files in web/public/assets/pdf/ to enable document search');
    }
  } catch (error) {
    console.error('❌ Error processing PDFs:', error.message);
    console.log('💡 Make sure PDF files are placed in web/public/assets/pdf/ directory');
  }

  // Create sample products
  console.log('🛍️ Creating sample products...');
  const sampleProducts = [
    {
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system',
      price: 999.99,
      category: 'Electronics'
    },
    {
      name: 'MacBook Air M3',
      description: 'Ultra-thin laptop with M3 chip, 13-inch Liquid Retina display, and all-day battery life',
      price: 1099.99,
      category: 'Electronics'
    },
    {
      name: 'AirPods Pro',
      description: 'Wireless earbuds with active noise cancellation and spatial audio',
      price: 249.99,
      category: 'Electronics'
    },
    {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with Max Air cushioning and breathable upper',
      price: 150.00,
      category: 'Sports'
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Android smartphone with AI-powered features and professional-grade camera',
      price: 799.99,
      category: 'Electronics'
    },
    {
      name: 'Coffee Maker Deluxe',
      description: 'Programmable coffee maker with thermal carafe and auto-shutoff feature',
      price: 89.99,
      category: 'Home & Kitchen'
    },
    {
      name: 'Wireless Charging Pad',
      description: 'Fast wireless charging pad compatible with iPhone and Android devices',
      price: 29.99,
      category: 'Electronics'
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable waterproof speaker with 360-degree sound and 12-hour battery',
      price: 79.99,
      category: 'Electronics'
    }
  ];

  // Clear existing products
  await prisma.product.deleteMany({});
  console.log('🧹 Cleared existing products');

  // Create products
  for (const productData of sampleProducts) {
    const product = await prisma.product.create({
      data: productData
    });
    console.log(`✅ Created product: ${product.name} (${product.category})`);
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
