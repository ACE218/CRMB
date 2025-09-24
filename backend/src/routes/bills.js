const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

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

// @desc    Get all bills with pagination and filtering
// @route   GET /api/bills
// @access  Private
router.get('/', protect, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'completed', 'cancelled', 'refunded', 'partial_refund'])
    .withMessage('Invalid status'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'partial', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
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
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate,
      customer,
      cashier,
      sortBy = 'billDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (customer) {
      filter.customer = customer;
    }

    if (cashier) {
      filter.cashier = { $regex: cashier, $options: 'i' };
    }

    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [bills, totalCount] = await Promise.all([
      Bill.find(filter)
        .populate('customer', 'firstName lastName email phone membershipNumber')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Bill.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message
    });
  }
});

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone address membershipNumber')
      .populate('items.product', 'name sku category brand');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: {
        bill
      }
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
});

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
router.post('/', protect, [
  body('customer')
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('cashier')
    .trim()
    .notEmpty()
    .withMessage('Cashier information is required'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'net_banking', 'wallet', 'credit', 'multiple'])
    .withMessage('Invalid payment method')
], validateRequest, async (req, res) => {
  try {
    const { customer, items, cashier, paymentMethod, paymentDetails, loyaltyPointsUsed, notes } = req.body;

    // Verify customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify products and calculate bill items
    const billItems = [];
    let insufficientStock = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`
        });
      }

      if (product.stockQuantity < item.quantity) {
        insufficientStock.push({
          product: product.name,
          available: product.stockQuantity,
          requested: item.quantity
        });
        continue;
      }

      // Calculate item totals
      const unitPrice = product.sellingPrice;
      const discountPercentage = item.discountPercentage || 0;
      const discountAmount = (unitPrice * item.quantity) * (discountPercentage / 100);
      const afterDiscount = (unitPrice * item.quantity) - discountAmount;
      const taxAmount = afterDiscount * (product.taxRate / 100);
      const lineTotal = afterDiscount + taxAmount;

      billItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice,
        discountPercentage,
        discountAmount,
        taxRate: product.taxRate,
        taxAmount,
        lineTotal
      });
    }

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for some items',
        insufficientStock
      });
    }

    // Create bill
    const billData = {
      customer,
      items: billItems,
      cashier,
      paymentMethod,
      loyaltyPointsUsed: loyaltyPointsUsed || 0,
      notes
    };

    if (paymentDetails) {
      billData.paymentDetails = paymentDetails;
      billData.amountPaid = paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
    }

    const bill = await Bill.create(billData);

    // Update product stock quantities
    for (const item of billItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity, salesCount: item.quantity } }
      );
    }

    // Update customer statistics
    const earnedPoints = customerDoc.updatePurchaseStats(bill.grandTotal);
    
    // Deduct loyalty points if used
    if (loyaltyPointsUsed > 0) {
      customerDoc.loyaltyPoints -= loyaltyPointsUsed;
    }
    
    await customerDoc.save();

    // Populate and return the created bill
    const populatedBill = await Bill.findById(bill._id)
      .populate('customer', 'firstName lastName email phone membershipNumber')
      .populate('items.product', 'name sku');

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        bill: populatedBill,
        loyaltyPointsEarned: earnedPoints
      }
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message
    });
  }
});

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private
router.put('/:id', protect, [
  body('status')
    .optional()
    .isIn(['draft', 'completed', 'cancelled', 'refunded', 'partial_refund'])
    .withMessage('Invalid status'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'partial', 'failed', 'refunded'])
    .withMessage('Invalid payment status')
], validateRequest, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['status', 'paymentStatus', 'notes', 'supervisor'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('customer', 'firstName lastName email phone membershipNumber');

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: {
        bill: updatedBill
      }
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bill',
      error: error.message
    });
  }
});

// @desc    Add payment to bill
// @route   POST /api/bills/:id/payments
// @access  Private
router.post('/:id/payments', protect, [
  body('method')
    .isIn(['cash', 'card', 'upi', 'net_banking', 'wallet'])
    .withMessage('Invalid payment method'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference cannot exceed 100 characters')
], validateRequest, async (req, res) => {
  try {
    const { method, amount, reference } = req.body;
    
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (bill.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Bill is already fully paid'
      });
    }

    // Check if payment amount exceeds remaining balance
    const remainingBalance = bill.grandTotal - bill.amountPaid - bill.loyaltyPointsUsed;
    if (amount > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance of ₹${remainingBalance}`
      });
    }

    // Add payment
    const paymentData = {
      method,
      amount,
      reference,
      status: 'completed'
    };

    bill.applyPayment(paymentData);

    res.json({
      success: true,
      message: 'Payment added successfully',
      data: {
        bill,
        payment: paymentData,
        remainingBalance: bill.grandTotal - bill.amountPaid - bill.loyaltyPointsUsed
      }
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding payment',
      error: error.message
    });
  }
});

// @desc    Get sales summary
// @route   GET /api/bills/reports/sales-summary
// @access  Private
router.get('/reports/sales-summary', protect, [
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
    const { startDate, endDate } = req.query;
    
    // Default to today if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const summary = await Bill.getSalesSummary(start, end);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalSales: 0,
          totalBills: 0,
          totalItems: 0,
          averageBillValue: 0,
          totalDiscount: 0,
          totalTax: 0
        },
        period: {
          startDate: start,
          endDate: end
        }
      }
    });
  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales summary',
      error: error.message
    });
  }
});

// @desc    Get top customers
// @route   GET /api/bills/reports/top-customers
// @access  Private
router.get('/reports/top-customers', protect, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
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
    const { limit = 10, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const topCustomers = await Bill.getTopCustomers(parseInt(limit), start, end);

    res.json({
      success: true,
      data: {
        customers: topCustomers,
        count: topCustomers.length,
        period: start && end ? { startDate: start, endDate: end } : null
      }
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top customers',
      error: error.message
    });
  }
});

// @desc    Cancel bill
// @route   PUT /api/bills/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Cancellation reason must be between 5 and 200 characters')
], validateRequest, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const bill = await Bill.findById(req.params.id).populate('items.product');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (bill.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Bill is already cancelled'
      });
    }

    if (bill.status === 'completed' && bill.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed and paid bill. Please process a refund instead.'
      });
    }

    // Restore stock quantities
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { 
          $inc: { 
            stockQuantity: item.quantity,
            salesCount: -item.quantity 
          } 
        }
      );
    }

    // Update customer statistics if bill was completed
    if (bill.status === 'completed') {
      const customer = await Customer.findById(bill.customer);
      if (customer) {
        customer.totalPurchases = Math.max(0, customer.totalPurchases - 1);
        customer.totalSpent = Math.max(0, customer.totalSpent - bill.grandTotal);
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints + bill.loyaltyPointsUsed - bill.loyaltyPointsEarned);
        
        if (customer.totalPurchases > 0) {
          customer.averageOrderValue = customer.totalSpent / customer.totalPurchases;
        } else {
          customer.averageOrderValue = 0;
        }
        
        await customer.save();
      }
    }

    // Update bill status
    bill.status = 'cancelled';
    bill.notes = `${bill.notes || ''}\nCancelled: ${reason}`.trim();
    await bill.save();

    res.json({
      success: true,
      message: 'Bill cancelled successfully',
      data: {
        bill,
        reason
      }
    });
  } catch (error) {
    console.error('Cancel bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling bill',
      error: error.message
    });
  }
});

module.exports = router;
