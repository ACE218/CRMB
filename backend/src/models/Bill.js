const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  // Bill Identification
  billNumber: {
    type: String,
    required: [true, 'Bill number is required'],
    unique: true,
    uppercase: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  
  // Bill Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    productName: {
      type: String,
      required: [true, 'Product name is required']
    },
    sku: {
      type: String,
      required: [true, 'SKU is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'dozen', 'pack', 'box']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    taxRate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative']
    },
    taxAmount: {
      type: Number,
      required: [true, 'Tax amount is required'],
      min: [0, 'Tax amount cannot be negative']
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total cannot be negative']
    }
  }],

  // Financial Summary
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  totalDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Total discount cannot be negative']
  },
  totalTax: {
    type: Number,
    required: [true, 'Total tax is required'],
    min: [0, 'Total tax cannot be negative']
  },
  grandTotal: {
    type: Number,
    required: [true, 'Grand total is required'],
    min: [0, 'Grand total cannot be negative']
  },

  // Loyalty and Offers
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points used cannot be negative']
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points earned cannot be negative']
  },
  offersApplied: [{
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer'
    },
    offerName: String,
    discountAmount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  }],

  // Payment Information
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'card', 'upi', 'net_banking', 'wallet', 'credit', 'multiple']
  },
  paymentDetails: [{
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'net_banking', 'wallet', 'credit']
    },
    amount: {
      type: Number,
      min: [0, 'Payment amount cannot be negative']
    },
    reference: String, // Transaction ID, card last 4 digits, etc.
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    }
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'failed', 'refunded'],
    default: 'pending'
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },
  amountDue: {
    type: Number,
    default: 0,
    min: [0, 'Amount due cannot be negative']
  },

  // Bill Type and Status
  billType: {
    type: String,
    enum: ['sale', 'return', 'exchange', 'credit_note'],
    default: 'sale'
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'cancelled', 'refunded', 'partial_refund'],
    default: 'draft'
  },
  
  // Dates
  billDate: {
    type: Date,
    required: [true, 'Bill date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date
  },

  // Staff Information
  cashier: {
    type: String,
    required: [true, 'Cashier information is required']
  },
  supervisor: {
    type: String
  },
  
  // Store Information
  store: {
    name: {
      type: String,
      default: 'Main Store'
    },
    address: {
      type: String
    },
    contact: {
      type: String
    },
    gstin: {
      type: String
    }
  },

  // Additional Information
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  isDelivery: {
    type: Boolean,
    default: false
  },
  deliveryCharges: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charges cannot be negative']
  },

  // Return/Exchange Information
  originalBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  returnReason: {
    type: String,
    trim: true
  },

  // Digital Receipt
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptPath: {
    type: String
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  smsSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
billSchema.index({ billNumber: 1 });
billSchema.index({ customer: 1 });
billSchema.index({ billDate: -1 });
billSchema.index({ status: 1 });
billSchema.index({ paymentStatus: 1 });
billSchema.index({ cashier: 1 });
billSchema.index({ grandTotal: 1 });
billSchema.index({ createdAt: -1 });

// Compound indexes
billSchema.index({ customer: 1, billDate: -1 });
billSchema.index({ status: 1, paymentStatus: 1 });

// Virtual for total items count
billSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for payment balance
billSchema.virtual('balance').get(function() {
  return this.grandTotal - this.amountPaid;
});

// Virtual for is overdue
billSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.paymentStatus === 'paid') return false;
  return new Date() > this.dueDate;
});

// Pre-save middleware to generate bill number
billSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      billDate: {
        $gte: new Date(year, today.getMonth(), today.getDate()),
        $lt: new Date(year, today.getMonth(), today.getDate() + 1)
      }
    });
    
    this.billNumber = `INV${year}${month}${date}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate totals
billSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    item.discountAmount = itemSubtotal * (item.discountPercentage / 100);
    const afterDiscount = itemSubtotal - item.discountAmount;
    item.taxAmount = afterDiscount * (item.taxRate / 100);
    item.lineTotal = afterDiscount + item.taxAmount;
    return total + itemSubtotal;
  }, 0);

  // Calculate total discount
  this.totalDiscount = this.items.reduce((total, item) => total + item.discountAmount, 0);

  // Calculate total tax
  this.totalTax = this.items.reduce((total, item) => total + item.taxAmount, 0);

  // Calculate grand total
  this.grandTotal = this.subtotal - this.totalDiscount + this.totalTax + this.deliveryCharges;

  // Calculate amount due
  this.amountDue = this.grandTotal - this.amountPaid - this.loyaltyPointsUsed;

  // Update payment status based on amount paid
  if (this.amountPaid >= this.grandTotal) {
    this.paymentStatus = 'paid';
    this.amountDue = 0;
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'pending';
  }

  next();
});

// Instance method to add item to bill
billSchema.methods.addItem = function(itemData) {
  this.items.push(itemData);
  this.save();
};

// Instance method to remove item from bill
billSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => !item._id.equals(itemId));
  this.save();
};

// Instance method to apply payment
billSchema.methods.applyPayment = function(paymentData) {
  this.paymentDetails.push(paymentData);
  this.amountPaid += paymentData.amount;
  this.save();
};

// Instance method to apply loyalty points
billSchema.methods.applyLoyaltyPoints = function(points) {
  // Assuming 1 point = ₹1
  const pointValue = points;
  const maxApplicable = Math.min(pointValue, this.grandTotal * 0.5); // Max 50% of bill
  
  this.loyaltyPointsUsed = Math.min(points, maxApplicable);
  this.save();
  
  return this.loyaltyPointsUsed;
};

// Static method to get sales summary for a date range
billSchema.statics.getSalesSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        billDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$grandTotal' },
        totalBills: { $sum: 1 },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        averageBillValue: { $avg: '$grandTotal' },
        totalDiscount: { $sum: '$totalDiscount' },
        totalTax: { $sum: '$totalTax' }
      }
    }
  ]);
};

// Static method to get top customers by spending
billSchema.statics.getTopCustomers = function(limit = 10, startDate, endDate) {
  const matchStage = {
    status: 'completed'
  };
  
  if (startDate && endDate) {
    matchStage.billDate = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$grandTotal' },
        totalBills: { $sum: 1 },
        averageBillValue: { $avg: '$grandTotal' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customerDetails'
      }
    },
    { $unwind: '$customerDetails' }
  ]);
};

module.exports = mongoose.model('Bill', billSchema);
