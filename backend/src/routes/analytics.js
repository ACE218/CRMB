const express = require('express');
const { query, validationResult } = require('express-validator');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @desc    Get dashboard overview
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Today's sales
    const todaySales = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: startOfDay, $lte: endOfDay },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);

    // This month's sales
    const thisMonthSales = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    // Last month's sales for comparison
    const lastMonthSales = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    // Customer statistics
    const customerStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          newCustomersThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfMonth] },
                1,
                0
              ]
            }
          },
          vipCustomers: {
            $sum: { $cond: [{ $eq: ['$customerType', 'vip'] }, 1, 0] }
          },
          loyalCustomers: {
            $sum: { $cond: [{ $eq: ['$customerType', 'loyal'] }, 1, 0] }
          }
        }
      }
    ]);

    // Inventory alerts
    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$reorderPoint'] }
    });

    const outOfStockProducts = await Product.countDocuments({
      isActive: true,
      stockQuantity: 0
    });

    // Recent activities (last 10 bills)
    const recentBills = await Bill.find({ status: 'completed' })
      .populate('customer', 'firstName lastName membershipNumber')
      .sort({ billDate: -1 })
      .limit(10)
      .select('billNumber grandTotal billDate customer cashier');

    // Calculate growth percentages
    const todayData = todaySales[0] || { totalSales: 0, totalBills: 0, totalItems: 0 };
    const thisMonthData = thisMonthSales[0] || { totalSales: 0, totalBills: 0 };
    const lastMonthData = lastMonthSales[0] || { totalSales: 0, totalBills: 0 };
    const customerData = customerStats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomersThisMonth: 0,
      vipCustomers: 0,
      loyalCustomers: 0
    };

    const salesGrowth = lastMonthData.totalSales > 0 
      ? (((thisMonthData.totalSales - lastMonthData.totalSales) / lastMonthData.totalSales) * 100).toFixed(2)
      : 0;

    const billsGrowth = lastMonthData.totalBills > 0
      ? (((thisMonthData.totalBills - lastMonthData.totalBills) / lastMonthData.totalBills) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        today: {
          sales: todayData.totalSales || 0,
          bills: todayData.totalBills || 0,
          items: todayData.totalItems || 0,
          averageBillValue: todayData.totalBills > 0 ? (todayData.totalSales / todayData.totalBills) : 0
        },
        thisMonth: {
          sales: thisMonthData.totalSales || 0,
          bills: thisMonthData.totalBills || 0,
          salesGrowth: parseFloat(salesGrowth),
          billsGrowth: parseFloat(billsGrowth)
        },
        customers: customerData,
        inventory: {
          lowStockAlerts: lowStockProducts,
          outOfStockAlerts: outOfStockProducts
        },
        recentActivity: recentBills
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private
router.get('/sales', protect, [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be day, week, month, or year'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], validateRequest, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    let start, end, groupBy;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      const now = new Date();
      switch (period) {
        case 'day':
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
          groupBy = { hour: { $hour: '$billDate' } };
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          end = new Date();
          groupBy = { date: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } } };
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date();
          groupBy = { date: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } } };
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date();
          groupBy = { month: { $month: '$billDate' }, year: { $year: '$billDate' } };
          break;
      }
    }

    if (!groupBy) {
      groupBy = { date: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } } };
    }

    const salesData = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          averageBillValue: { $avg: '$grandTotal' },
          totalDiscount: { $sum: '$totalDiscount' },
          totalTax: { $sum: '$totalTax' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Payment method breakdown
    const paymentMethods = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' }
        }
      }
    ]);

    // Hourly sales pattern (for insights)
    const hourlySales = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { hour: { $hour: '$billDate' } },
          totalSales: { $sum: '$grandTotal' },
          billCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        dateRange: { start, end },
        salesTrend: salesData,
        paymentMethods,
        hourlySales,
        summary: {
          totalSales: salesData.reduce((sum, day) => sum + day.totalSales, 0),
          totalBills: salesData.reduce((sum, day) => sum + day.totalBills, 0),
          totalItems: salesData.reduce((sum, day) => sum + day.totalItems, 0),
          averageBillValue: salesData.length > 0 
            ? salesData.reduce((sum, day) => sum + day.averageBillValue, 0) / salesData.length 
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales analytics',
      error: error.message
    });
  }
});

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private
router.get('/customers', protect, async (req, res) => {
  try {
    // Customer distribution by type
    const customerTypeDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$customerType',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalSpent' },
          averageSpent: { $avg: '$totalSpent' }
        }
      }
    ]);

    // Customer acquisition over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const customerAcquisition = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newCustomers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Customer loyalty analysis
    const loyaltyAnalysis = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$totalPurchases',
          boundaries: [0, 1, 5, 10, 20, 50, 100],
          default: '100+',
          output: {
            count: { $sum: 1 },
            averageSpent: { $avg: '$totalSpent' },
            totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
          }
        }
      }
    ]);

    // Spending distribution
    const spendingDistribution = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 1000, 5000, 10000, 25000, 50000, 100000],
          default: '100000+',
          output: {
            count: { $sum: 1 },
            averagePurchases: { $avg: '$totalPurchases' }
          }
        }
      }
    ]);

    // Top customers by spending
    const topCustomers = await Customer.find({ isActive: true })
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('firstName lastName email membershipNumber totalSpent totalPurchases customerType');

    // Inactive customers (no purchase in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const inactiveCustomers = await Customer.countDocuments({
      isActive: true,
      $or: [
        { lastPurchaseDate: { $lt: ninetyDaysAgo } },
        { lastPurchaseDate: null }
      ]
    });

    res.json({
      success: true,
      data: {
        distribution: {
          byType: customerTypeDistribution,
          byLoyalty: loyaltyAnalysis,
          bySpending: spendingDistribution
        },
        acquisition: customerAcquisition,
        topCustomers,
        insights: {
          totalActiveCustomers: await Customer.countDocuments({ isActive: true }),
          inactiveCustomers,
          averageLifetimeValue: customerTypeDistribution.reduce((sum, type) => 
            sum + (type.totalSpent * type.count), 0) / 
            customerTypeDistribution.reduce((sum, type) => sum + type.count, 0) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer analytics',
      error: error.message
    });
  }
});

// @desc    Get product analytics
// @route   GET /api/analytics/products
// @access  Private
router.get('/products', protect, [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  query('category')
    .optional()
    .trim()
], validateRequest, async (req, res) => {
  try {
    const { period = 'month', category } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    // Build match criteria for bills
    const billMatchCriteria = {
      billDate: { $gte: startDate },
      status: 'completed'
    };

    // Top selling products
    const topSellingProducts = await Bill.aggregate([
      { $match: billMatchCriteria },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
          timesOrdered: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      ...(category ? [{ $match: { 'productDetails.category': category } }] : []),
      {
        $project: {
          name: '$productDetails.name',
          sku: '$productDetails.sku',
          category: '$productDetails.category',
          brand: '$productDetails.brand',
          totalQuantitySold: 1,
          totalRevenue: 1,
          timesOrdered: 1,
          averageQuantityPerOrder: { $divide: ['$totalQuantitySold', '$timesOrdered'] }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 20 }
    ]);

    // Category performance
    const categoryPerformance = await Bill.aggregate([
      { $match: billMatchCriteria },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
          uniqueProducts: { $addToSet: '$product._id' },
          averagePrice: { $avg: '$items.unitPrice' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalQuantitySold: 1,
          totalRevenue: 1,
          uniqueProductCount: { $size: '$uniqueProducts' },
          averagePrice: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Slow moving products (low sales)
    const slowMovingProducts = await Product.aggregate([
      {
        $match: {
          isActive: true,
          ...(category ? { category } : {})
        }
      },
      {
        $lookup: {
          from: 'bills',
          let: { productId: '$_id' },
          pipeline: [
            { $match: billMatchCriteria },
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.product', '$$productId'] } } },
            {
              $group: {
                _id: null,
                totalSold: { $sum: '$items.quantity' }
              }
            }
          ],
          as: 'salesData'
        }
      },
      {
        $project: {
          name: 1,
          sku: 1,
          category: 1,
          brand: 1,
          stockQuantity: 1,
          sellingPrice: 1,
          totalSold: { $ifNull: [{ $arrayElemAt: ['$salesData.totalSold', 0] }, 0] }
        }
      },
      { $match: { totalSold: { $lt: 5 } } }, // Less than 5 units sold
      { $sort: { totalSold: 1, stockQuantity: -1 } },
      { $limit: 20 }
    ]);

    // Stock value analysis
    const stockAnalysis = await Product.aggregate([
      {
        $match: {
          isActive: true,
          ...(category ? { category } : {})
        }
      },
      {
        $group: {
          _id: '$category',
          totalStockValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } },
          totalStockQuantity: { $sum: '$stockQuantity' },
          productCount: { $sum: 1 },
          averagePrice: { $avg: '$sellingPrice' }
        }
      },
      { $sort: { totalStockValue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        category: category || 'all',
        topSellingProducts,
        categoryPerformance,
        slowMovingProducts,
        stockAnalysis,
        summary: {
          totalProductsSold: topSellingProducts.reduce((sum, p) => sum + p.totalQuantitySold, 0),
          totalRevenue: topSellingProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
          categoriesAnalyzed: categoryPerformance.length,
          slowMovingCount: slowMovingProducts.length
        }
      }
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product analytics',
      error: error.message
    });
  }
});

// @desc    Get inventory analytics
// @route   GET /api/analytics/inventory
// @access  Private
router.get('/inventory', protect, async (req, res) => {
  try {
    // Stock level distribution
    const stockDistribution = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $addFields: {
          stockLevel: {
            $cond: [
              { $eq: ['$stockQuantity', 0] }, 'Out of Stock',
              {
                $cond: [
                  { $lte: ['$stockQuantity', '$reorderPoint'] }, 'Low Stock',
                  {
                    $cond: [
                      { $lte: ['$stockQuantity', '$minStockLevel'] }, 'Minimum Stock',
                      'Adequate Stock'
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$stockLevel',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } }
        }
      }
    ]);

    // Category-wise stock value
    const categoryStockValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalStockValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } },
          totalStockQuantity: { $sum: '$stockQuantity' },
          productCount: { $sum: 1 },
          lowStockProducts: {
            $sum: {
              $cond: [{ $lte: ['$stockQuantity', '$reorderPoint'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { totalStockValue: -1 } }
    ]);

    // Products needing attention
    const needingAttention = {
      outOfStock: await Product.find({ isActive: true, stockQuantity: 0 })
        .select('name sku category stockQuantity')
        .limit(10),
      lowStock: await Product.find({
        isActive: true,
        stockQuantity: { $gt: 0 },
        $expr: { $lte: ['$stockQuantity', '$reorderPoint'] }
      })
        .select('name sku category stockQuantity reorderPoint')
        .limit(10),
      expiringSoon: await Product.find({
        isActive: true,
        isPerishable: true,
        expiryDate: {
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          $gte: new Date()
        }
      })
        .select('name sku category expiryDate stockQuantity')
        .limit(10)
    };

    // Inventory turnover (simplified calculation)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inventoryTurnover = await Bill.aggregate([
      {
        $match: {
          billDate: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          category: '$product.category',
          currentStock: '$product.stockQuantity',
          soldInPeriod: '$totalSold',
          turnoverRate: {
            $cond: [
              { $gt: ['$product.stockQuantity', 0] },
              { $divide: ['$totalSold', '$product.stockQuantity'] },
              0
            ]
          }
        }
      },
      { $sort: { turnoverRate: -1 } },
      { $limit: 20 }
    ]);

    // Total inventory value
    const totalInventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } },
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$stockQuantity' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stockDistribution,
        categoryStockValue,
        needingAttention,
        inventoryTurnover,
        summary: totalInventoryValue[0] || {
          totalValue: 0,
          totalProducts: 0,
          totalQuantity: 0
        }
      }
    });
  } catch (error) {
    console.error('Get inventory analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory analytics',
      error: error.message
    });
  }
});

module.exports = router;
