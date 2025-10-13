const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get buyer dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get total orders
    const totalOrders = await prisma.order.count({
      where: { userId }
    });

    // Get total spent
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { total: true }
    });

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    // Get completed orders
    const completedOrders = await prisma.order.count({
      where: {
        userId,
        status: 'DELIVERED'
      }
    });

    // Get this month's stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthOrders = await prisma.order.findMany({
      where: {
        userId,
        createdAt: {
          gte: thisMonth
        }
      },
      select: { total: true }
    });

    const thisMonthOrdersCount = thisMonthOrders.length;
    const thisMonthSpent = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);

    const stats = {
      totalOrders,
      totalSpent,
      pendingOrders,
      completedOrders,
      thisMonthOrders: thisMonthOrdersCount,
      thisMonthSpent
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get buyer dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get buyer orders
router.get('/orders', async (req, res) => {
  try {
    const { userId, status, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const where = {
      userId: userId
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: {
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
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order tracking details
router.get('/orders/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: userId
      },
      include: {
        product: {
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
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create tracking timeline
    const timeline = [
      {
        status: 'PENDING',
        label: 'Orden Creada',
        description: 'Tu orden ha sido creada y está esperando confirmación del vendedor',
        date: order.createdAt,
        completed: true
      }
    ];

    if (order.status !== 'PENDING') {
      timeline.push({
        status: 'CONFIRMED',
        label: 'Orden Confirmada',
        description: 'El vendedor ha confirmado tu orden y está preparando el envío',
        date: order.updatedAt,
        completed: order.status === 'CONFIRMED' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
      });
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      timeline.push({
        status: 'SHIPPED',
        label: 'Orden Enviada',
        description: 'Tu orden ha sido enviada y está en tránsito',
        date: order.updatedAt,
        completed: order.status === 'SHIPPED' || order.status === 'DELIVERED'
      });
    }

    if (order.status === 'DELIVERED') {
      timeline.push({
        status: 'DELIVERED',
        label: 'Orden Entregada',
        description: 'Tu orden ha sido entregada exitosamente',
        date: order.updatedAt,
        completed: true
      });
    }

    if (order.status === 'CANCELLED') {
      timeline.push({
        status: 'CANCELLED',
        label: 'Orden Cancelada',
        description: 'Tu orden ha sido cancelada',
        date: order.updatedAt,
        completed: true
      });
    }

    res.json({
      order,
      tracking: {
        currentStatus: order.status,
        timeline
      }
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get buyer statistics
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
        userId: userId,
        createdAt: dateFilter
      },
      include: {
        product: {
          select: {
            category: true
          }
        }
      }
    });

    // Calculate category preferences
    const categoryCount = {};
    orders.forEach(order => {
      const category = order.product.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
      ordersByStatus: {
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
        SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
        DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
        CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
      },
      topCategories
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get buyer stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get favorite sellers (most ordered from)
router.get('/favorite-sellers', async (req, res) => {
  try {
    const { userId, limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                whatsapp: true,
                instagram: true
              }
            }
          }
        }
      }
    });

    // Group by seller
    const sellerCount = {};
    orders.forEach(order => {
      const seller = order.product.user;
      if (!sellerCount[seller.id]) {
        sellerCount[seller.id] = {
          seller,
          orderCount: 0,
          totalSpent: 0
        };
      }
      sellerCount[seller.id].orderCount++;
      sellerCount[seller.id].totalSpent += order.total;
    });

    const favoriteSellers = Object.values(sellerCount)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, parseInt(limit));

    res.json({ favoriteSellers });
  } catch (error) {
    console.error('Get favorite sellers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
