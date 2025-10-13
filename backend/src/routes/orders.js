const express = require('express');
const { PrismaClient } = require('@prisma/client');
const NotificationService = require('../services/NotificationService');
const QRService = require('../services/QRService');

const router = express.Router();
const prisma = new PrismaClient();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status) {
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
            phone: true
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
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
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

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { userId, productId, total, quantity = 1, branchId, notes } = req.body;

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
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
            instagram: true,
            facebook: true
          }
        }
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or not available' });
    }

    if (!product.user) {
      return res.status(404).json({ error: 'Product seller not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Validate or set default branch
    let finalBranchId = branchId;
    if (branchId) {
      const branchExists = await prisma.branch.findUnique({
        where: { id: branchId, isActive: true }
      });
      if (!branchExists) {
        return res.status(400).json({ error: 'Invalid or inactive branch' });
      }
    } else {
      // Get the first active branch as default
      const defaultBranch = await prisma.branch.findFirst({
        where: { isActive: true }
      });
      if (!defaultBranch) {
        return res.status(500).json({ error: 'No active branches available' });
      }
      finalBranchId = defaultBranch.id;
    }

    // Generate QR code for the order
    const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { qrCode, qrSecretToken } = QRService.generateQRCode(tempOrderId);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        total: parseFloat(total),
        quantity: parseInt(quantity),
        qrCode,
        qrSecretToken,
        branchId: finalBranchId,
        notes,
        status: 'PENDING'
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
            instagram: true,
            facebook: true
          }
        },
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
                instagram: true,
                facebook: true
              }
            }
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

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } }
    });

    // Notify seller about new order
    await NotificationService.notifyNewOrder(
      product.userId,
      order.id,
      product.title,
      `${order.user.firstName} ${order.user.lastName}`,
      order.total
    );

    // Notify client to contact seller for payment
    console.log('🔍 Product user info:', product.user);
    await NotificationService.notifyContactSeller(
      userId,
      order.id,
      product.title,
      {
        whatsapp: product.user?.whatsapp,
        instagram: product.user?.instagram,
        facebook: product.user?.facebook,
        phone: product.user?.phone
      }
    );

    // Check if product is now low stock or out of stock
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, title: true }
    });

    if (updatedProduct.stock === 0) {
      await NotificationService.notifyOutOfStock(
        product.userId,
        productId,
        updatedProduct.title
      );
    } else if (updatedProduct.stock <= 5) {
      await NotificationService.notifyLowStock(
        product.userId,
        productId,
        updatedProduct.title,
        updatedProduct.stock
      );
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
      qrImageUrl: QRService.createQRImageUrl(qrCode)
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

