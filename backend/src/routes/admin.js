const express = require('express');
const { PrismaClient } = require('@prisma/client');
const QRService = require('../services/QRService');
const NotificationService = require('../services/NotificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware para verificar que el usuario es administrador
const verifyAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, isActive: true }
    });

    if (!user || user.userType !== 'ADMIN' || !user.isActive) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Obtener todas las sucursales
router.get('/branches', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear nueva sucursal
router.post('/branches', verifyAdmin, async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        email
      }
    });

    res.status(201).json({
      message: 'Branch created successfully',
      branch
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener órdenes listas para retiro en una sucursal
router.get('/branches/:branchId/orders-ready', verifyAdmin, async (req, res) => {
  try {
    const { branchId } = req.params;

    const orders = await prisma.order.findMany({
      where: {
        branchId,
        status: 'READY_FOR_PICKUP'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get ready orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Escanear QR y confirmar producto listo para retiro
router.post('/scan-qr', verifyAdmin, async (req, res) => {
  try {
    const { scannedQR, userId } = req.body;

    if (!scannedQR) {
      return res.status(400).json({ error: 'QR code is required' });
    }

    // Validar el QR escaneado
    const qrData = QRService.validateQRCode(scannedQR);
    if (!qrData) {
      return res.status(400).json({ error: 'Invalid or expired QR code' });
    }

    // Buscar la orden
    const order = await prisma.order.findUnique({
      where: { id: qrData.orderId },
      include: {
        user: true,
        product: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verificar que el token coincide
    if (order.qrSecretToken !== qrData.token) {
      return res.status(400).json({ error: 'Invalid QR token' });
    }

    // Verificar que la orden está en estado correcto
    if (order.status !== 'PREPARING') {
      return res.status(400).json({ 
        error: `Order is not ready for pickup. Current status: ${order.status}` 
      });
    }

    // Actualizar estado a READY_FOR_PICKUP
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { 
        status: 'READY_FOR_PICKUP',
        pickupCode: QRService.generatePickupCode()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        }
      }
    });

    // Notificar al cliente que su producto está listo
    await NotificationService.notifyProductReady(
      order.userId,
      order.id,
      order.product.title,
      order.pickupCode,
      order.branchId
    );

    res.json({
      message: 'Product confirmed ready for pickup',
      order: updatedOrder,
      pickupCode: updatedOrder.pickupCode
    });

  } catch (error) {
    console.error('Scan QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirmar retiro de producto por cliente
router.post('/confirm-pickup', verifyAdmin, async (req, res) => {
  try {
    const { orderId, pickupCode, userId } = req.body;

    if (!orderId || !pickupCode) {
      return res.status(400).json({ error: 'Order ID and pickup code are required' });
    }

    // Buscar la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        product: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verificar código de retiro
    if (order.pickupCode !== pickupCode) {
      return res.status(400).json({ error: 'Invalid pickup code' });
    }

    // Verificar que está listo para retiro
    if (order.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({ 
        error: `Order is not ready for pickup. Current status: ${order.status}` 
      });
    }

    // Actualizar estado a PICKED_UP
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PICKED_UP' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        }
      }
    });

    // Notificar al vendedor que el producto fue retirado
    await NotificationService.notifyProductPickedUp(
      order.product.userId,
      order.id,
      order.product.title,
      `${order.user.firstName} ${order.user.lastName}`
    );

    res.json({
      message: 'Product pickup confirmed',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Confirm pickup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard del administrador
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    // Estadísticas generales
    const totalOrders = await prisma.order.count();
    const readyForPickup = await prisma.order.count({
      where: { status: 'READY_FOR_PICKUP' }
    });
    const totalBranches = await prisma.branch.count({
      where: { isActive: true }
    });

    // Órdenes recientes
    const recentOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['READY_FOR_PICKUP', 'PICKED_UP']
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        product: {
          select: {
            title: true
          }
        },
        branch: {
          select: {
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const stats = {
      totalOrders,
      readyForPickup,
      totalBranches,
      recentOrders
    };

    res.json({ stats });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
