const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock Offer model (in a real application, you would create a proper Offer model)
const Offer = {
  // Sample offers
  sampleOffers: [
    {
      id: '1',
      name: 'New Customer Discount',
      description: '10% off for new customers',
      discountType: 'percentage',
      discountValue: 10,
      criteria: { customerType: ['new'] },
      isActive: true
    },
    {
      id: '2',
      name: 'Loyalty Points Bonus',
      description: 'Double loyalty points for VIP customers',
      discountType: 'points_multiplier',
      discountValue: 2,
      criteria: { customerType: ['vip'] },
      isActive: true
    },
    {
      id: '3',
      name: 'Big Spender Discount',
      description: '15% off for customers who spent over ₹50,000',
      discountType: 'percentage',
      discountValue: 15,
      criteria: { minTotalSpent: 50000 },
      isActive: true
    }
  ],

  findEligible: function(customer) {
    return this.sampleOffers.filter(offer => {
      if (!offer.isActive) return false;
      
      const criteria = offer.criteria;
      
      // Check customer type
      if (criteria.customerType && !criteria.customerType.includes(customer.customerType)) {
        return false;
      }
      
      // Check minimum spending
      if (criteria.minTotalSpent && customer.totalSpent < criteria.minTotalSpent) {
        return false;
      }
      
      // Check minimum loyalty points
      if (criteria.minLoyaltyPoints && customer.loyaltyPoints < criteria.minLoyaltyPoints) {
        return false;
      }
      
      return true;
    });
  }
};

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

// @desc    Get all available offers
// @route   GET /api/offers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const offers = Offer.sampleOffers.filter(offer => offer.isActive);

    res.json({
      success: true,
      data: {
        offers,
        count: offers.length
      }
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
});

// @desc    Get offers for a specific customer
// @route   GET /api/offers/customer/:customerId
// @access  Private
router.get('/customer/:customerId', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const eligibleOffers = Offer.findEligible(customer);

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          membershipNumber: customer.membershipNumber,
          customerType: customer.customerType,
          totalSpent: customer.totalSpent,
          loyaltyPoints: customer.loyaltyPoints
        },
        offers: eligibleOffers,
        count: eligibleOffers.length
      }
    });
  } catch (error) {
    console.error('Get customer offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer offers',
      error: error.message
    });
  }
});

// @desc    Apply offer to calculate discount
// @route   POST /api/offers/apply
// @access  Private
router.post('/apply', protect, [
  body('customerId')
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  body('offerId')
    .notEmpty()
    .withMessage('Offer ID is required'),
  body('billAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Bill amount must be greater than 0')
], validateRequest, async (req, res) => {
  try {
    const { customerId, offerId, billAmount } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const offer = Offer.sampleOffers.find(o => o.id === offerId && o.isActive);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or inactive'
      });
    }

    // Check if customer is eligible
    const eligibleOffers = Offer.findEligible(customer);
    const isEligible = eligibleOffers.some(o => o.id === offerId);

    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: 'Customer is not eligible for this offer'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    let loyaltyPointsMultiplier = 1;

    if (offer.discountType === 'percentage') {
      discountAmount = (billAmount * offer.discountValue) / 100;
    } else if (offer.discountType === 'fixed') {
      discountAmount = Math.min(offer.discountValue, billAmount);
    } else if (offer.discountType === 'points_multiplier') {
      loyaltyPointsMultiplier = offer.discountValue;
    }

    // Apply maximum discount limits (e.g., max 50% of bill amount)
    const maxDiscount = billAmount * 0.5;
    discountAmount = Math.min(discountAmount, maxDiscount);

    res.json({
      success: true,
      message: 'Offer applied successfully',
      data: {
        offer: {
          id: offer.id,
          name: offer.name,
          description: offer.description,
          discountType: offer.discountType
        },
        discount: {
          amount: discountAmount,
          percentage: ((discountAmount / billAmount) * 100).toFixed(2)
        },
        loyaltyPointsMultiplier,
        finalAmount: billAmount - discountAmount,
        savings: discountAmount
      }
    });
  } catch (error) {
    console.error('Apply offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying offer',
      error: error.message
    });
  }
});

// @desc    Get offer recommendations based on customer behavior
// @route   GET /api/offers/recommendations/:customerId
// @access  Private
router.get('/recommendations/:customerId', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const Bill = require('../models/Bill');

    // Get customer's purchase history
    const recentBills = await Bill.find({
      customer: customer._id,
      status: 'completed',
      billDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).limit(10);

    // Analyze customer behavior
    const totalBills = recentBills.length;
    const averageBillValue = recentBills.reduce((sum, bill) => sum + bill.grandTotal, 0) / totalBills || 0;
    const daysSinceLastPurchase = customer.lastPurchaseDate 
      ? Math.floor((new Date() - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24))
      : null;

    // Generate recommendations
    const recommendations = [];

    // Recommendation 1: Return customer offer
    if (daysSinceLastPurchase > 30) {
      recommendations.push({
        type: 'return_customer',
        title: 'Welcome Back!',
        description: `It's been ${daysSinceLastPurchase} days since your last visit. Here's 5% off your next purchase!`,
        discountType: 'percentage',
        discountValue: 5,
        priority: 'high'
      });
    }

    // Recommendation 2: Upgrade customer type
    if (customer.customerType === 'regular' && customer.totalSpent > 40000) {
      recommendations.push({
        type: 'upgrade_incentive',
        title: 'Almost VIP!',
        description: 'Spend ₹10,000 more to become a VIP member and enjoy exclusive benefits!',
        discountType: 'points_multiplier',
        discountValue: 1.5,
        priority: 'medium'
      });
    }

    // Recommendation 3: Loyalty points reminder
    if (customer.loyaltyPoints > 1000) {
      recommendations.push({
        type: 'use_points',
        title: 'Use Your Points!',
        description: `You have ${customer.loyaltyPoints} loyalty points. Use them on your next purchase!`,
        discountType: 'points_redemption',
        discountValue: customer.loyaltyPoints,
        priority: 'medium'
      });
    }

    // Recommendation 4: High value customer appreciation
    if (averageBillValue > 2000) {
      recommendations.push({
        type: 'high_value_appreciation',
        title: 'Thank You for Being a Valued Customer!',
        description: 'Enjoy 10% off as our appreciation for your continued loyalty.',
        discountType: 'percentage',
        discountValue: 10,
        priority: 'high'
      });
    }

    // Get eligible standard offers
    const standardOffers = Offer.findEligible(customer);

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          customerType: customer.customerType,
          totalSpent: customer.totalSpent,
          loyaltyPoints: customer.loyaltyPoints,
          daysSinceLastPurchase
        },
        personalizedRecommendations: recommendations,
        standardOffers,
        analytics: {
          totalRecentBills: totalBills,
          averageBillValue: Math.round(averageBillValue),
          customerSince: customer.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// @desc    Validate offer code
// @route   POST /api/offers/validate
// @access  Private
router.post('/validate', protect, [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Offer code is required'),
  body('customerId')
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  body('billAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Bill amount must be greater than 0')
], validateRequest, async (req, res) => {
  try {
    const { code, customerId, billAmount } = req.body;

    // Mock offer codes (in a real application, you would have a proper database)
    const offerCodes = {
      'WELCOME10': {
        name: 'Welcome Offer',
        discountType: 'percentage',
        discountValue: 10,
        minBillAmount: 500,
        maxUses: 1,
        validTill: new Date('2025-12-31')
      },
      'SAVE15': {
        name: 'Save 15%',
        discountType: 'percentage',
        discountValue: 15,
        minBillAmount: 1000,
        maxUses: 3,
        validTill: new Date('2025-12-31')
      },
      'FLAT100': {
        name: 'Flat ₹100 Off',
        discountType: 'fixed',
        discountValue: 100,
        minBillAmount: 1500,
        maxUses: 2,
        validTill: new Date('2025-12-31')
      }
    };

    const offer = offerCodes[code.toUpperCase()];

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid offer code'
      });
    }

    // Check if offer is expired
    if (new Date() > offer.validTill) {
      return res.status(400).json({
        success: false,
        message: 'Offer code has expired'
      });
    }

    // Check minimum bill amount
    if (billAmount < offer.minBillAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum bill amount of ₹${offer.minBillAmount} required for this offer`
      });
    }

    // Calculate discount
    let discountAmount = 0;

    if (offer.discountType === 'percentage') {
      discountAmount = (billAmount * offer.discountValue) / 100;
    } else if (offer.discountType === 'fixed') {
      discountAmount = Math.min(offer.discountValue, billAmount);
    }

    // Apply maximum discount limit
    const maxDiscount = billAmount * 0.5;
    discountAmount = Math.min(discountAmount, maxDiscount);

    res.json({
      success: true,
      message: 'Offer code is valid',
      data: {
        code: code.toUpperCase(),
        offer: {
          name: offer.name,
          discountType: offer.discountType,
          discountValue: offer.discountValue
        },
        discount: {
          amount: discountAmount,
          percentage: ((discountAmount / billAmount) * 100).toFixed(2)
        },
        finalAmount: billAmount - discountAmount,
        savings: discountAmount,
        validTill: offer.validTill
      }
    });
  } catch (error) {
    console.error('Validate offer code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating offer code',
      error: error.message
    });
  }
});

module.exports = router;
