// backend/src/api/payment/index.ts
import { Router, Request, Response } from 'express';
import midtransClient from 'midtrans-client';
import prisma from '../../lib/prisma';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Midtrans configuration
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!
});

// Create payment for order
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId } = req.body;

    console.log('Creating Midtrans payment for order:', orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this order'
      });
    }

    // Check if order is pending
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Order already processed'
      });
    }

    // Generate unique transaction ID
    const transactionId = `ORDER-${order.id}-${Date.now()}`;

    // Prepare item details for Midtrans
    const itemDetails = order.orderItems.map(item => ({
      id: item.productId,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.product.name.substring(0, 50)
    }));

    // Add shipping fee
    if (order.shippingFee && order.shippingFee > 0) {
      itemDetails.push({
        id: 'SHIPPING',
        price: Math.round(order.shippingFee),
        quantity: 1,
        name: 'Ongkos Kirim'
      });
    }

    // Prepare customer details
    const customerDetails = {
      first_name: order.customerName?.split(' ')[0] || user.username,
      last_name: order.customerName?.split(' ').slice(1).join(' ') || '',
      email: order.customerEmail || user.email,
      phone: order.customerPhone || '08123456789',
      billing_address: {
        first_name: order.customerName?.split(' ')[0] || user.username,
        last_name: order.customerName?.split(' ').slice(1).join(' ') || '',
        email: order.customerEmail || user.email,
        phone: order.customerPhone || '08123456789',
        address: order.shippingAddress || '',
        city: 'Jakarta',
        postal_code: '12345',
        country_code: 'IDN'
      },
      shipping_address: {
        first_name: order.customerName?.split(' ')[0] || user.username,
        last_name: order.customerName?.split(' ').slice(1).join(' ') || '',
        email: order.customerEmail || user.email,
        phone: order.customerPhone || '08123456789',
        address: order.shippingAddress || '',
        city: 'Jakarta',
        postal_code: '12345',
        country_code: 'IDN'
      }
    };

    // Prepare transaction parameter
    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: Math.round(order.total)
      },
      item_details: itemDetails,
      customer_details: customerDetails,
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/order/success?orderId=${orderId}`,
        error: `${process.env.FRONTEND_URL}/order/failed?orderId=${orderId}`,
        pending: `${process.env.FRONTEND_URL}/order/pending?orderId=${orderId}`
      },
      expiry: {
        unit: 'hours',
        duration: 24
      },
      credit_card: {
        secure: true
      }
    };

    console.log('Creating Midtrans transaction:', JSON.stringify(parameter, null, 2));

    // Create Midtrans transaction
    const transaction = await snap.createTransaction(parameter);

    console.log('Midtrans response:', transaction);

    // Update order with payment info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentToken: transaction.token,
        paymentUrl: transaction.redirect_url,
        midtransOrderId: transactionId,
        paymentStatus: 'PENDING'
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_PAYMENT',
        details: `Created Midtrans payment for order ${orderId}`,
        ipAddress: req.ip || 'unknown'
      }
    });

    res.json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId
    });

  } catch (error: any) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment'
    });
  }
});

// Midtrans notification handler (webhook) - PASTIKAN INI ADA
router.post('/notification', async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    console.log('=== MIDTRANS NOTIFICATION RECEIVED ===');
    console.log('Notification body:', JSON.stringify(notification, null, 2));

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log('Processing notification:', {
      orderId,
      transactionStatus,
      fraudStatus,
      paymentType: notification.payment_type,
      grossAmount: notification.gross_amount
    });

    // Extract original order ID from Midtrans order ID format
    // Format: ORDER-{orderId}-{timestamp}
    const orderMatch = orderId.match(/ORDER-(.+?)-\d+/);
    const originalOrderId = orderMatch ? orderMatch[1] : null;

    if (!originalOrderId) {
      console.error('Could not extract order ID from Midtrans order ID:', orderId);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order ID format' 
      });
    }

    console.log('Original order ID extracted:', originalOrderId);

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: originalOrderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      console.error('Order not found:', originalOrderId);
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    let newStatus = order.status;
    let paymentStatus = transactionStatus;

    // Map Midtrans status to our order status
    switch (transactionStatus) {
      case 'capture':
        if (fraudStatus === 'challenge') {
          newStatus = 'PENDING';
          paymentStatus = 'CHALLENGE';
        } else if (fraudStatus === 'accept') {
          newStatus = 'PROCESSING'; // Payment successful
          paymentStatus = 'PAID';
        }
        break;
        
      case 'settlement':
        newStatus = 'PROCESSING'; // Payment settled
        paymentStatus = 'PAID';
        break;
        
      case 'pending':
        newStatus = 'PENDING';
        paymentStatus = 'PENDING';
        break;
        
      case 'deny':
        newStatus = 'CANCELLED';
        paymentStatus = 'DENIED';
        // Restore stock if denied
        for (const item of order.orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }
        break;
        
      case 'expire':
        newStatus = 'CANCELLED';
        paymentStatus = 'EXPIRED';
        // Restore stock if expired
        for (const item of order.orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }
        break;
        
      case 'cancel':
        newStatus = 'CANCELLED';
        paymentStatus = 'CANCELLED';
        // Restore stock if cancelled
        for (const item of order.orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }
        break;
    }

    // Update order with new status
    const updatedOrder = await prisma.order.update({
      where: { id: originalOrderId },
      data: {
        status: newStatus,
        paymentStatus: paymentStatus,
        paymentMethod: notification.payment_type || order.paymentMethod,
        updatedAt: new Date()
      }
    });

    // Log the notification
    await prisma.activityLog.create({
      data: {
        userId: order.userId,
        action: 'PAYMENT_NOTIFICATION',
        details: `Payment notification: ${transactionStatus} for order ${originalOrderId}`,
        ipAddress: req.ip || 'unknown'
      }
    });

    console.log(`Order ${originalOrderId} updated: status=${newStatus}, payment=${paymentStatus}`);

    res.status(200).json({ 
      success: true, 
      message: 'Notification processed successfully',
      data: {
        orderId: originalOrderId,
        status: newStatus,
        paymentStatus: paymentStatus
      }
    });

  } catch (error: any) {
    console.error('Notification processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process notification',
      stack: process.env.NODE_ENV ? error.stack : undefined
    });
  }
});

export default router;