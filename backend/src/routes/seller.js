const express = require('express');
const { PrismaClient } = require('@prisma/client');
const NotificationService = require('../services/NotificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Get seller dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get seller stats
    let sellerStats = await prisma.sellerStats.findUnique({
      where: { userId }
    });

    if (!sellerStats) {
      sellerStats = await prisma.sellerStats.create({
        data: { userId }
      });
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: {
        product: {
          userId: userId
        },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        product: true
      }
    });

    const todaySales = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        product: {
          userId: userId
        },
        status: 'PENDING'
      }
    });

    // Get low stock products count
    const lowStockProducts = await prisma.product.count({
      where: {
        userId: userId,
        isActive: true,
        stock: {
          lte: 5
        }
      }
    });

    const stats = {
      totalSales: sellerStats.totalSales,
      totalRevenue: sellerStats.totalRevenue,
      pendingOrders,
      lowStockProducts,
      todaySales,
      todayRevenue
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get seller dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get seller orders
router.get('/orders', async (req, res) => {
  try {
    const { userId, status, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const where = {
      product: {
        userId: userId
      }
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsapp: true,
            instagram: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const validStatuses = [
      'PENDING', 
      'PAYMENT_PENDING', 
      'PAYMENT_CONFIRMED', 
      'PREPARING', 
      'READY_FOR_PICKUP', 
      'PICKED_UP', 
      'DELIVERED', 
      'CANCELLED'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify the order belongs to the seller
    const order = await prisma.order.findFirst({
      where: {
        id,
        product: {
          userId: userId
        }
      },
      include: {
        user: true,
        product: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not authorized' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsapp: true,
            instagram: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            category: true
          }
        }
      }
    });

    // Notify buyer about status change
    await NotificationService.notifyOrderStatusChange(
      order.userId,
      order.id,
      order.product.title,
      status,
      `${order.product.user.firstName} ${order.product.user.lastName}`
    );

    // Update seller stats if order is delivered
    if (status === 'DELIVERED') {
      await prisma.sellerStats.upsert({
        where: { userId },
        update: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: order.total },
          productsSold: { increment: 1 },
          lastUpdated: new Date()
        },
        create: {
          userId,
          totalSales: 1,
          totalRevenue: order.total,
          productsSold: 1
        }
      });
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get seller products
router.get('/products', async (req, res) => {
  try {
    const { userId, category, stock, search, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const where = {
      userId: userId
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (stock && stock !== 'ALL') {
      switch (stock) {
        case 'IN_STOCK':
          where.stock = { gt: 10 };
          break;
        case 'LOW_STOCK':
          where.stock = { gt: 0, lte: 10 };
          break;
        case 'OUT_OF_STOCK':
          where.stock = 0;
          break;
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({ products });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock products
router.get('/products/low-stock', async (req, res) => {
  try {
    const { userId, threshold = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const products = await prisma.product.findMany({
      where: {
        userId: userId,
        isActive: true,
        stock: {
          lte: parseInt(threshold)
        }
      },
      select: {
        id: true,
        title: true,
        stock: true,
        category: true
      },
      orderBy: { stock: 'asc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product stock
router.put('/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify the product belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or not authorized' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: parseInt(stock) },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    res.json({
      message: 'Product stock updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify the product belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or not authorized' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify the product belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: userId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or not authorized' });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get seller statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId, period = 'month' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: monthAgo };
        break;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: yearAgo };
        break;
    }

    const orders = await prisma.order.findMany({
      where: {
        product: {
          userId: userId
        },
        createdAt: dateFilter
      },
      include: {
        product: true
      }
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
      ordersByStatus: {
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
        SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
        DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
        CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get seller stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm payment received
router.put('/orders/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, paymentMethod } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify the order belongs to the seller
    const order = await prisma.order.findFirst({
      where: {
        id,
        product: {
          userId: userId
        }
      },
      include: {
        user: true,
        product: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not authorized' });
    }

    // Verify order is in correct status
    if (order.status !== 'PAYMENT_PENDING' && order.status !== 'PENDING') {
      return res.status(400).json({ 
        error: `Cannot confirm payment. Current status: ${order.status}` 
      });
    }

    // Update order status to PAYMENT_CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: 'PAYMENT_CONFIRMED',
        paymentMethod: paymentMethod || 'efectivo'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsapp: true,
            instagram: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            category: true
          }
        }
      }
    });

    // Notify buyer about payment confirmation
    await NotificationService.notifyOrderStatusChange(
      order.userId,
      order.id,
      order.product.title,
      'PAYMENT_CONFIRMED',
      `${order.product.user.firstName} ${order.product.user.lastName}`
    );

    res.json({
      message: 'Payment confirmed successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark product as delivered to branch
router.put('/orders/:id/deliver-to-branch', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify the order belongs to the seller
    const order = await prisma.order.findFirst({
      where: {
        id,
        product: {
          userId: userId
        }
      },
      include: {
        user: true,
        product: true,
        branch: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not authorized' });
    }

    // Verify order is in correct status
    if (!['PENDING', 'PAYMENT_CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ 
        error: `Cannot deliver to branch. Current status: ${order.status}` 
      });
    }

    // Generate new QR code with real order ID
    const { qrCode, qrSecretToken } = QRService.generateQRCode(id);

    // Update order status to PREPARING and add QR code
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: 'PREPARING',
        qrCode: qrCode,
        qrSecretToken: qrSecretToken
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsapp: true,
            instagram: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            category: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    // Notify buyer that product is being prepared
    await NotificationService.notifyOrderStatusChange(
      order.userId,
      order.id,
      order.product.title,
      'PREPARING',
      `${order.product.user.firstName} ${order.product.user.lastName}`
    );

    res.json({
      message: 'Product marked as delivered to branch',
      order: updatedOrder,
      qrCode: qrCode,
      qrImageUrl: require('../services/QRService').createQRImageUrl(qrCode)
    });

  } catch (error) {
    console.error('Deliver to branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
