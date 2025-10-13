const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        companyName: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const totalProducts = await prisma.product.count({
      where: { userId: userId }
    });

    const totalOrders = await prisma.order.count({
      where: { userId: userId }
    });

    // Get seller stats if user has products
    let sellerStats = null;
    if (totalProducts > 0) {
      sellerStats = await prisma.sellerStats.findUnique({
        where: { userId: userId }
      });
    }

    const stats = {
      totalProducts,
      totalOrders,
      totalSales: sellerStats?.totalSales || 0,
      totalRevenue: sellerStats?.totalRevenue || 0
    };

    res.json({ user, stats });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for discovery)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        whatsapp: true,
        instagram: true,
        createdAt: true
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        whatsapp: true,
        instagram: true,
        createdAt: true,
        products: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            category: true
          }
        },
        reels: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            thumbnail: true,
            views: true,
            likes: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, bio, phone, whatsapp, instagram } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        bio,
        phone,
        whatsapp,
        instagram
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        phone: true,
        whatsapp: true,
        instagram: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

