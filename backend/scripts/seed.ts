import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password untuk admin
  const password = await bcrypt.hash('admin123', 10);

  // Seed Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@bloomsisters.com' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@bloomsisters.com',
      password: password,
      role: 'SUPERADMIN',
    },
  });

  // Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bloomsisters.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@bloomsisters.com',
      password: password,
      role: 'ADMIN',
    },
  });

  // Seed regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@bloomsisters.com' },
    update: {},
    create: {
      username: 'user',
      email: 'user@bloomsisters.com',
      password: password,
      role: 'USER',
    },
  });

//   // Seed sample products
//   const products = await Promise.all([
//     prisma.product.upsert({
//       where: { name: 'Spring Bliss Bouquet' },
//       update: {},
//       create: {
//         name: 'Spring Bliss Bouquet',
//         description: 'A beautiful mix of spring flowers including tulips, daffodils, and hyacinths.',
//         price: 45.99,
//         image: '/images/spring-bliss.jpg',
//         stock: 20,
//       },
//     }),
//     prisma.product.upsert({
//       where: { name: 'Romantic Roses' },
//       update: {},
//       create: {
//         name: 'Romantic Roses',
//         description: 'A dozen red roses with baby\'s breath and greenery.',
//         price: 59.99,
//         image: '/images/roses.jpg',
//         stock: 15,
//       },
//     }),
//     prisma.product.upsert({
//       where: { name: 'Tropical Paradise' },
//       update: {},
//       create: {
//         name: 'Tropical Paradise',
//         description: 'Exotic tropical flowers including orchids, birds of paradise, and anthuriums.',
//         price: 75.50,
//         image: '/images/tropical.jpg',
//         stock: 10,
//       },
//     }),
//   ]);

  console.log('✅ Seed completed successfully!');
  console.log('📊 Seed Results:');
  console.log(`- Superadmin: ${superadmin.username} (${superadmin.email})`);
  console.log(`- Admin: ${admin.username} (${admin.email})`);
  console.log(`- User: ${user.username} (${user.email})`);
//   console.log(`- Products: ${products.length} created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });