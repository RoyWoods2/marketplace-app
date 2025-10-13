const { PrismaClient } = require('@prisma/client');
const NotificationService = require('./NotificationService');

const prisma = new PrismaClient();

class StockService {
  // Check if product has enough stock
  static async checkStock(productId, quantity = 1) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, isActive: true }
      });

      if (!product || !product.isActive) {
        return { available: false, reason: 'Product not found or inactive' };
      }

      if (product.stock < quantity) {
        return { 
          available: false, 
          reason: 'Insufficient stock',
          currentStock: product.stock,
          requestedQuantity: quantity
        };
      }

      return { 
        available: true, 
        currentStock: product.stock,
        requestedQuantity: quantity
      };
    } catch (error) {
      console.error('Error checking stock:', error);
      throw error;
    }
  }

  // Reduce product stock
  static async reduceStock(productId, quantity = 1) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { 
          id: true, 
          title: true, 
          stock: true, 
          userId: true,
          isActive: true 
        }
      });

      if (!product || !product.isActive) {
        throw new Error('Product not found or inactive');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
        select: { stock: true }
      });

      // Check if stock is now low or out
      await this.checkAndNotifyStockLevels(productId, updatedProduct.stock);

      return {
        success: true,
        newStock: updatedProduct.stock,
        previousStock: product.stock
      };
    } catch (error) {
      console.error('Error reducing stock:', error);
      throw error;
    }
  }

  // Restore product stock (for order cancellations)
  static async restoreStock(productId, quantity = 1) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { 
          id: true, 
          title: true, 
          stock: true, 
          userId: true,
          isActive: true 
        }
      });

      if (!product || !product.isActive) {
        throw new Error('Product not found or inactive');
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
        select: { stock: true }
      });

      return {
        success: true,
        newStock: updatedProduct.stock,
        previousStock: product.stock
      };
    } catch (error) {
      console.error('Error restoring stock:', error);
      throw error;
    }
  }

  // Update product stock manually
  static async updateStock(productId, newStock, userId) {
    try {
      // Verify the product belongs to the user
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          userId: userId
        },
        select: { 
          id: true, 
          title: true, 
          stock: true, 
          userId: true 
        }
      });

      if (!product) {
        throw new Error('Product not found or not authorized');
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { stock: parseInt(newStock) },
        select: { stock: true }
      });

      // Check if stock is now low or out
      await this.checkAndNotifyStockLevels(productId, updatedProduct.stock);

      return {
        success: true,
        newStock: updatedProduct.stock,
        previousStock: product.stock
      };
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // Check and notify about stock levels
  static async checkAndNotifyStockLevels(productId, currentStock) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { 
          id: true, 
          title: true, 
          userId: true,
          isActive: true 
        }
      });

      if (!product || !product.isActive) {
        return;
      }

      // Check if user should receive notifications
      const shouldNotify = await NotificationService.shouldNotify(product.userId, 'STOCK_LOW');

      if (!shouldNotify) {
        return;
      }

      if (currentStock === 0) {
        await NotificationService.notifyOutOfStock(
          product.userId,
          productId,
          product.title
        );
      } else if (currentStock <= 5) {
        await NotificationService.notifyLowStock(
          product.userId,
          productId,
          product.title,
          currentStock
        );
      }
    } catch (error) {
      console.error('Error checking stock levels:', error);
    }
  }

  // Get products with low stock for a seller
  static async getLowStockProducts(sellerId, threshold = 5) {
    try {
      const products = await prisma.product.findMany({
        where: {
          userId: sellerId,
          isActive: true,
          stock: {
            lte: threshold
          }
        },
        select: {
          id: true,
          title: true,
          stock: true,
          category: true,
          price: true,
          images: true
        },
        orderBy: { stock: 'asc' }
      });

      return products;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }

  // Get products out of stock for a seller
  static async getOutOfStockProducts(sellerId) {
    try {
      const products = await prisma.product.findMany({
        where: {
          userId: sellerId,
          isActive: true,
          stock: 0
        },
        select: {
          id: true,
          title: true,
          stock: true,
          category: true,
          price: true,
          images: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      return products;
    } catch (error) {
      console.error('Error getting out of stock products:', error);
      throw error;
    }
  }

  // Bulk update stock for multiple products
  static async bulkUpdateStock(sellerId, stockUpdates) {
    try {
      const results = [];

      for (const update of stockUpdates) {
        try {
          const result = await this.updateStock(
            update.productId,
            update.newStock,
            sellerId
          );
          results.push({
            productId: update.productId,
            success: true,
            ...result
          });
        } catch (error) {
          results.push({
            productId: update.productId,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw error;
    }
  }

  // Get stock analytics for a seller
  static async getStockAnalytics(sellerId, period = 'month') {
    try {
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

      // Get all products for the seller
      const products = await prisma.product.findMany({
        where: {
          userId: sellerId,
          isActive: true
        },
        select: {
          id: true,
          title: true,
          stock: true,
          category: true,
          orders: {
            where: {
              createdAt: dateFilter
            },
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      // Calculate analytics
      const totalProducts = products.length;
      const outOfStock = products.filter(p => p.stock === 0).length;
      const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
      const inStock = products.filter(p => p.stock > 5).length;

      // Calculate stock turnover
      const totalStockSold = products.reduce((sum, product) => {
        return sum + product.orders.filter(order => 
          ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)
        ).length;
      }, 0);

      const averageStockLevel = products.reduce((sum, product) => sum + product.stock, 0) / totalProducts;

      // Get top selling products by stock turnover
      const topSellingProducts = products
        .map(product => ({
          ...product,
          stockTurnover: product.orders.filter(order => 
            ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)
          ).length
        }))
        .sort((a, b) => b.stockTurnover - a.stockTurnover)
        .slice(0, 10);

      return {
        totalProducts,
        outOfStock,
        lowStock,
        inStock,
        totalStockSold,
        averageStockLevel: Math.round(averageStockLevel * 100) / 100,
        topSellingProducts,
        stockDistribution: {
          outOfStock: (outOfStock / totalProducts) * 100,
          lowStock: (lowStock / totalProducts) * 100,
          inStock: (inStock / totalProducts) * 100
        }
      };
    } catch (error) {
      console.error('Error getting stock analytics:', error);
      throw error;
    }
  }

  // Auto-reorder suggestions based on sales history
  static async getReorderSuggestions(sellerId, lookbackDays = 30) {
    try {
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

      const products = await prisma.product.findMany({
        where: {
          userId: sellerId,
          isActive: true
        },
        select: {
          id: true,
          title: true,
          stock: true,
          category: true,
          orders: {
            where: {
              createdAt: { gte: lookbackDate },
              status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }
            },
            select: {
              id: true,
              createdAt: true
            }
          }
        }
      });

      const suggestions = products.map(product => {
        const salesCount = product.orders.length;
        const dailySalesRate = salesCount / lookbackDays;
        const currentStock = product.stock;
        const daysOfStockRemaining = currentStock / dailySalesRate;
        
        let suggestion = 'NONE';
        let suggestedQuantity = 0;
        let urgency = 'LOW';

        if (currentStock === 0) {
          suggestion = 'REORDER_NOW';
          suggestedQuantity = Math.ceil(dailySalesRate * 30); // 30 days of stock
          urgency = 'HIGH';
        } else if (daysOfStockRemaining <= 7) {
          suggestion = 'REORDER_SOON';
          suggestedQuantity = Math.ceil(dailySalesRate * 30);
          urgency = 'MEDIUM';
        } else if (daysOfStockRemaining <= 14) {
          suggestion = 'PLAN_REORDER';
          suggestedQuantity = Math.ceil(dailySalesRate * 30);
          urgency = 'LOW';
        }

        return {
          productId: product.id,
          productTitle: product.title,
          category: product.category,
          currentStock,
          dailySalesRate: Math.round(dailySalesRate * 100) / 100,
          daysOfStockRemaining: Math.round(daysOfStockRemaining * 100) / 100,
          suggestion,
          suggestedQuantity,
          urgency
        };
      });

      return suggestions.filter(s => s.suggestion !== 'NONE');
    } catch (error) {
      console.error('Error getting reorder suggestions:', error);
      throw error;
    }
  }

  // Validate stock operation
  static async validateStockOperation(productId, operation, quantity, userId) {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          userId: userId
        },
        select: {
          id: true,
          title: true,
          stock: true,
          isActive: true
        }
      });

      if (!product) {
        return { valid: false, error: 'Product not found or not authorized' };
      }

      if (!product.isActive) {
        return { valid: false, error: 'Product is inactive' };
      }

      if (operation === 'reduce' && product.stock < quantity) {
        return { 
          valid: false, 
          error: 'Insufficient stock',
          currentStock: product.stock,
          requestedQuantity: quantity
        };
      }

      if (quantity < 0) {
        return { valid: false, error: 'Quantity cannot be negative' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating stock operation:', error);
      return { valid: false, error: 'Validation error' };
    }
  }
}

module.exports = StockService;
