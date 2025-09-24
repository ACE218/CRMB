const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit ZIP code']
    }
  },

  // Customer Classification
  customerType: {
    type: String,
    enum: ['new', 'regular', 'loyal', 'vip'],
    default: 'new'
  },
  membershipNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Financial Information
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  // Purchase History Summary
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },

  // Communication Preferences
  communicationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    promotionalEmails: {
      type: Boolean,
      default: true
    },
    promotionalSMS: {
      type: Boolean,
      default: false
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isStaff: {
    type: Boolean,
    default: false
  },
  isBlacklisted: {
    type: Boolean,
    default: false
  },
  blacklistReason: {
    type: String,
    trim: true
  },

  // Authentication (for online customers)
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },

  // Metadata
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ membershipNumber: 1 });
customerSchema.index({ customerType: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for purchase frequency
customerSchema.virtual('purchaseFrequency').get(function() {
  if (this.totalPurchases === 0) return 'Never';
  if (this.totalPurchases < 5) return 'Low';
  if (this.totalPurchases < 20) return 'Medium';
  return 'High';
});

// Pre-save middleware to hash password
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Pre-save middleware to generate membership number
customerSchema.pre('save', async function(next) {
  if (this.isNew && !this.membershipNumber) {
    const count = await this.constructor.countDocuments();
    this.membershipNumber = `CRM${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to update customer type based on spending
customerSchema.pre('save', function(next) {
  if (this.isModified('totalSpent')) {
    if (this.totalSpent >= 100000) {
      this.customerType = 'vip';
    } else if (this.totalSpent >= 50000) {
      this.customerType = 'loyal';
    } else if (this.totalSpent >= 10000) {
      this.customerType = 'regular';
    }
  }
  next();
});

// Instance method to compare password
customerSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to calculate loyalty points earned from amount
customerSchema.methods.calculateLoyaltyPoints = function(amount) {
  const basePoints = Math.floor(amount / 100); // 1 point per ₹100
  
  // Bonus points based on customer type
  let multiplier = 1;
  switch (this.customerType) {
    case 'loyal': multiplier = 1.5; break;
    case 'vip': multiplier = 2; break;
    default: multiplier = 1;
  }
  
  return Math.floor(basePoints * multiplier);
};

// Instance method to update purchase statistics
customerSchema.methods.updatePurchaseStats = function(billAmount) {
  this.totalPurchases += 1;
  this.totalSpent += billAmount;
  this.lastPurchaseDate = new Date();
  this.averageOrderValue = this.totalSpent / this.totalPurchases;
  
  // Add loyalty points
  const earnedPoints = this.calculateLoyaltyPoints(billAmount);
  this.loyaltyPoints += earnedPoints;
  
  return earnedPoints;
};

// Static method to find customers eligible for offers
customerSchema.statics.findEligibleForOffers = function(offerCriteria) {
  const query = { isActive: true, isBlacklisted: false };
  
  if (offerCriteria.customerType) {
    query.customerType = { $in: offerCriteria.customerType };
  }
  
  if (offerCriteria.minTotalSpent) {
    query.totalSpent = { $gte: offerCriteria.minTotalSpent };
  }
  
  if (offerCriteria.minLoyaltyPoints) {
    query.loyaltyPoints = { $gte: offerCriteria.minLoyaltyPoints };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Customer', customerSchema);
