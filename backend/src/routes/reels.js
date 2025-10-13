const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all reels (feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reels = await prisma.reel.findMany({
      where: { isActive: true },
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

    res.json({ reels });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reel by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reel = await prisma.reel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
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
            category: true,
            description: true
          }
        }
      }
    });

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Increment view count
    await prisma.reel.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json({ reel });
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create reel
router.post('/', async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail, duration, userId, productId } = req.body;

    const reel = await prisma.reel.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnail,
        duration: parseInt(duration),
        userId,
        productId: productId || null
      },
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

    res.status(201).json({
      message: 'Reel created successfully',
      reel
    });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/Unlike reel
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const increment = action === 'like' ? 1 : -1;

    const reel = await prisma.reel.update({
      where: { id },
      data: { likes: { increment } },
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

    res.json({
      message: `Reel ${action}d successfully`,
      reel
    });
  } catch (error) {
    console.error('Like reel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reel
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;

    const updatedReel = await prisma.reel.update({
      where: { id },
      data: {
        title,
        description,
        isActive
      },
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

    res.json({
      message: 'Reel updated successfully',
      reel: updatedReel
    });
  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete reel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.reel.delete({
      where: { id }
    });

    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

