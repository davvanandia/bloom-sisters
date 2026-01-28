import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedOrders() {
  try {
    console.log('🌱 Seeding orders data...');

    // Cek apakah sudah ada orders
    const existingOrders = await prisma.order.count();
    
    if (existingOrders > 0) {
      console.log(`✅ Database already has ${existingOrders} orders`);
      
      // Tampilkan statistik orders yang ada
      const stats = await prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });
      
      console.log('Current order statistics:');
      stats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat._count.id}`);
      });
      
      return;
    }

    // Cari user dan produk yang sudah ada
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@bloomsisters.com' },
          { role: 'ADMIN' }
        ]
      }
    });

    const regularUser = await prisma.user.findFirst({
      where: {
        role: 'USER'
      }
    });

    const products = await prisma.product.findMany({
      take: 3
    });

    const voucher = await prisma.voucher.findFirst({
      where: {
        code: 'DISKON10'
      }
    });

    if (!regularUser) {
      console.log('❌ No regular user found. Creating one...');
      
      const userPassword = await bcrypt.hash('user123', 10);
      const newUser = await prisma.user.create({
        data: {
          username: 'johndoe',
          email: 'john@example.com',
          password: userPassword,
          role: 'USER'
        }
      });
      console.log(`✅ Created user: ${newUser.email}`);
    }

    if (products.length === 0) {
      console.log('❌ No products found. Creating sample products...');
      
      const sampleProducts = await Promise.all([
        prisma.product.create({
          data: {
            name: 'Buket Mawar Merah',
            slug: 'buket-mawar-merah',
            description: 'Buket bunga mawar merah segar',
            price: 250000,
            stock: 50,
            category: 'Bouquet',
            images: ['https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400'],
            tags: ['mawar', 'merah', 'romantis'],
            featured: true
          }
        }),
        prisma.product.create({
          data: {
            name: 'Buket Lily Putih',
            slug: 'buket-lily-putih',
            description: 'Buket bunga lily putih elegan',
            price: 180000,
            stock: 30,
            category: 'Bouquet',
            images: ['https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400'],
            tags: ['lily', 'putih', 'elegan'],
            featured: true
          }
        }),
        prisma.product.create({
          data: {
            name: 'Buket Campuran',
            slug: 'buket-campuran',
            description: 'Buket bunga campuran berbagai jenis',
            price: 200000,
            stock: 40,
            category: 'Bouquet',
            images: ['https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400'],
            tags: ['campuran', 'warna-warni', 'ceria']
          }
        })
      ]);
      
      products.push(...sampleProducts);
      console.log(`✅ Created ${sampleProducts.length} sample products`);
    }

    // Ambil user regular untuk orders
    const userForOrders = regularUser || await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    if (!userForOrders) {
      throw new Error('No user available for orders');
    }

    // Buat sample orders
    const orders = await Promise.all([
      // Order 1: Completed
      prisma.order.create({
        data: {
          userId: userForOrders.id,
          total: 430000,
          status: 'COMPLETED',
          voucherId: voucher?.id,
          createdAt: new Date('2024-01-15T10:30:00Z')
        }
      }),
      // Order 2: Processing
      prisma.order.create({
        data: {
          userId: userForOrders.id,
          total: 180000,
          status: 'PROCESSING',
          createdAt: new Date('2024-01-20T14:45:00Z')
        }
      }),
      // Order 3: Pending
      prisma.order.create({
        data: {
          userId: userForOrders.id,
          total: 200000,
          status: 'PENDING',
          createdAt: new Date('2024-01-22T09:15:00Z')
        }
      }),
      // Order 4: Cancelled
      prisma.order.create({
        data: {
          userId: userForOrders.id,
          total: 250000,
          status: 'CANCELLED',
          createdAt: new Date('2024-01-10T16:20:00Z')
        }
      }),
      // Order 5: Completed
      prisma.order.create({
        data: {
          userId: userForOrders.id,
          total: 360000,
          status: 'COMPLETED',
          createdAt: new Date('2024-01-18T11:10:00Z')
        }
      })
    ]);

    console.log(`✅ Created ${orders.length} sample orders`);

    // Buat order items untuk setiap order
    const orderItemsData = [
      // Order 1 items
      {
        orderId: orders[0].id,
        productId: products[0].id,
        quantity: 1,
        price: 250000
      },
      {
        orderId: orders[0].id,
        productId: products[1].id,
        quantity: 1,
        price: 180000
      },
      // Order 2 items
      {
        orderId: orders[1].id,
        productId: products[1].id,
        quantity: 1,
        price: 180000
      },
      // Order 3 items
      {
        orderId: orders[2].id,
        productId: products[2].id,
        quantity: 1,
        price: 200000
      },
      // Order 4 items
      {
        orderId: orders[3].id,
        productId: products[0].id,
        quantity: 1,
        price: 250000
      },
      // Order 5 items
      {
        orderId: orders[4].id,
        productId: products[0].id,
        quantity: 1,
        price: 250000
      },
      {
        orderId: orders[4].id,
        productId: products[2].id,
        quantity: 1,
        price: 110000
      }
    ];

    await prisma.orderItem.createMany({
      data: orderItemsData
    });

    console.log(`✅ Created ${orderItemsData.length} order items`);

    // Update total untuk order dengan voucher
    if (voucher && orders[0]) {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: orders[0].id }
      });
      
      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let discount = 0;
      
      if (voucher.type === 'PERCENTAGE') {
        discount = (subtotal * voucher.discount) / 100;
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
          discount = voucher.maxDiscount;
        }
      } else if (voucher.type === 'FIXED') {
        discount = voucher.discount;
      }
      
      const finalTotal = subtotal - discount;
      
      await prisma.order.update({
        where: { id: orders[0].id },
        data: { total: finalTotal }
      });
      
      console.log(`✅ Updated order ${orders[0].id} total to ${finalTotal} (discount applied: ${discount})`);
    }

    // Tampilkan statistik akhir
    const finalStats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    console.log('\n📊 Final order statistics:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.id}`);
    });

    const totalOrders = await prisma.order.count();
    console.log(`\n✅ Total orders in database: ${totalOrders}`);

  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan seeder
seedOrders()
  .then(() => {
    console.log('🎉 Order seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Order seeding failed:', error);
    process.exit(1);
  });