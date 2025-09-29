const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
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

// @desc    Get all customers with pagination and filtering
// @route   GET /api/customers
// @access  Private (Staff only)
router.get('/', protect, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('customerType')
    .optional()
    .isIn(['new', 'regular', 'loyal', 'vip'])
    .withMessage('Invalid customer type'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], validateRequest, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      customerType,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { membershipNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (customerType) {
      filter.customerType = customerType;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [customers, totalCount] = await Promise.all([
      Customer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      Customer.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        customers,
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
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customer
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Staff only)
router.post('/', protect, [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .isPostalCode('IN')
    .withMessage('Please provide a valid Indian ZIP code')
], validateRequest, async (req, res) => {
  try {
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email or phone already exists'
      });
    }

    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          membershipNumber: customer.membershipNumber,
          customerType: customer.customerType,
          loyaltyPoints: customer.loyaltyPoints,
          address: customer.address
        }
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Staff only)
router.put('/:id', protect, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number'),
  body('customerType')
    .optional()
    .isIn(['new', 'regular', 'loyal', 'vip'])
    .withMessage('Invalid customer type'),
  body('loyaltyPoints')
    .optional()
    .isNumeric()
    .withMessage('Loyalty points must be a number'),
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('Credit limit must be a number')
], validateRequest, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // If updating email or phone, check for duplicates
    if (req.body.email || req.body.phone) {
      const duplicateQuery = { _id: { $ne: req.params.id } };
      
      if (req.body.email) duplicateQuery.email = req.body.email;
      if (req.body.phone) duplicateQuery.phone = req.body.phone;

      const duplicate = await Customer.findOne(duplicateQuery);
      
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email or phone already exists'
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: {
        customer: updatedCustomer
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
});

// @desc    Deactivate customer
// @route   DELETE /api/customers/:id
// @access  Private (Staff only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Instead of deleting, deactivate the customer
    customer.isActive = false;
    await customer.save();

    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating customer',
      error: error.message
    });
  }
});

// @desc    Get customer purchase history
// @route   GET /api/customers/:id/purchases
// @access  Private
router.get('/:id/purchases', protect, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], validateRequest, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Bill = require('../models/Bill');

    const [bills, totalCount] = await Promise.all([
      Bill.find({ customer: req.params.id, status: 'completed' })
        .populate('items.product', 'name sku')
        .sort({ billDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bill.countDocuments({ customer: req.params.id, status: 'completed' })
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        purchases: bills,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase history',
      error: error.message
    });
  }
});

// @desc    Update customer loyalty points
// @route   PUT /api/customers/:id/loyalty-points
// @access  Private (Staff only)
router.put('/:id/loyalty-points', protect, [
  body('points')
    .isNumeric()
    .withMessage('Points must be a number'),
  body('operation')
    .isIn(['add', 'subtract', 'set'])
    .withMessage('Operation must be add, subtract, or set'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
], validateRequest, async (req, res) => {
  try {
    const { points, operation, reason } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    let newPoints = customer.loyaltyPoints;

    switch (operation) {
      case 'add':
        newPoints += points;
        break;
      case 'subtract':
        newPoints = Math.max(0, newPoints - points);
        break;
      case 'set':
        newPoints = Math.max(0, points);
        break;
    }

    customer.loyaltyPoints = newPoints;
    await customer.save();

    // Log the loyalty points transaction (in a real app, you might have a separate model for this)
    console.log(`Loyalty points ${operation}: Customer ${customer.membershipNumber}, Points: ${points}, Reason: ${reason || 'Manual adjustment'}`);

    res.json({
      success: true,
      message: 'Loyalty points updated successfully',
      data: {
        previousPoints: customer.loyaltyPoints - (newPoints - customer.loyaltyPoints),
        currentPoints: newPoints,
        operation,
        pointsChanged: points
      }
    });
  } catch (error) {
    console.error('Update loyalty points error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating loyalty points',
      error: error.message
    });
  }
});

// @desc    Get customer analytics
// @route   GET /api/customers/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const Bill = require('../models/Bill');

    // Get customer's bill analytics
    const analytics = await Bill.aggregate([
      {
        $match: {
          customer: customer._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalDiscount: { $sum: '$totalDiscount' },
          lastPurchase: { $max: '$billDate' },
          firstPurchase: { $min: '$billDate' }
        }
      }
    ]);

    // Get monthly spending trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlySpending = await Bill.aggregate([
      {
        $match: {
          customer: customer._id,
          status: 'completed',
          billDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' }
          },
          totalSpent: { $sum: '$grandTotal' },
          billCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          membershipNumber: customer.membershipNumber,
          customerType: customer.customerType,
          loyaltyPoints: customer.loyaltyPoints
        },
        analytics: analytics[0] || {
          totalBills: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          totalItems: 0,
          totalDiscount: 0,
          lastPurchase: null,
          firstPurchase: null
        },
        monthlySpending
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

// @desc    Get customer by phone number
// @route   GET /api/customers/phone/:phone
// @access  Private
router.get('/phone/:phone', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone }).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customer
      }
    });
  } catch (error) {
    console.error('Get customer by phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

module.exports = router;
