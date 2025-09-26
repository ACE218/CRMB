const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },

  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: [
      'Groceries',
      'Dairy & Eggs',
      'Fresh Produce',
      'Meat & Seafood',
      'Bakery',
      'Beverages',
      'Snacks & Confectionery',
      'Frozen Foods',
      'Personal Care',
      'Household & Cleaning',
      'Health & Wellness',
      'Baby Care',
      'Pet Care',
      'Electronics',
      'Books & Stationery',
      'Clothing & Accessories',
      'Home & Garden',
      'Sports & Outdoors',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },

  // Pricing Information
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },

  // Tax Information
  taxCategory: {
    type: String,
    required: [true, 'Tax category is required'],
    enum: ['GST_0', 'GST_5', 'GST_12', 'GST_18', 'GST_28', 'EXEMPT'],
    default: 'GST_18'
  },
  taxRate: {
    type: Number,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
    default: function() {
      const taxRates = {
        'GST_0': 0,
        'GST_5': 5,
        'GST_12': 12,
        'GST_18': 18,
        'GST_28': 28,
        'EXEMPT': 0
      };
      return taxRates[this.taxCategory] || 18;
    }
  },
  hsnCode: {
    type: String,
    trim: true
  },

  // Inventory Management
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: [0, 'Maximum stock level cannot be negative']
  },
  reorderPoint: {
    type: Number,
    default: 20,
    min: [0, 'Reorder point cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'dozen', 'pack', 'box', 'bottle'],
    default: 'piece'
  },

  // Product Specifications
  weight: {
    value: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    unit: {
      type: String,
      enum: ['kg', 'gram', 'liter', 'ml'],
      default: 'gram'
    }
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: {
      type: String,
      enum: ['cm', 'meter', 'inch'],
      default: 'cm'
    }
  },

  // Dates and Expiry
  manufacturingDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  shelfLife: {
    type: Number, // in days
    min: [0, 'Shelf life cannot be negative']
  },

  // Supplier Information
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },

  // Product Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPerishable: {
    type: Boolean,
    default: false
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Sales Analytics
  salesCount: {
    type: Number,
    default: 0,
    min: [0, 'Sales count cannot be negative']
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: [0, 'Revenue cannot be negative']
  },
  lastSoldDate: {
    type: Date
  },

  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ stockQuantity: 1 });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'Out of Stock';
  if (this.stockQuantity <= this.reorderPoint) return 'Low Stock';
  if (this.stockQuantity <= this.minStockLevel) return 'Minimum Stock';
  return 'In Stock';
});

// Virtual for price after discount
productSchema.virtual('discountedPrice').get(function() {
  return this.basePrice * (1 - this.discountPercentage / 100);
});

// Virtual for tax amount
productSchema.virtual('taxAmount').get(function() {
  return (this.sellingPrice * this.taxRate / 100).toFixed(2);
});

// Virtual for final price including tax
productSchema.virtual('finalPrice').get(function() {
  const discounted = this.discountedPrice;
  const tax = discounted * this.taxRate / 100;
  return (discounted + tax).toFixed(2);
});

// Virtual for days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to auto-calculate selling price if discount is applied
productSchema.pre('save', function(next) {
  if (this.isModified('basePrice') || this.isModified('discountPercentage')) {
    this.sellingPrice = this.basePrice * (1 - this.discountPercentage / 100);
  }
  next();
});

// Pre-save middleware to set tax rate based on tax category
productSchema.pre('validate', function(next) {
  if (this.taxCategory && !this.taxRate) {
    const taxRates = {
      'GST_0': 0,
      'GST_5': 5,
      'GST_12': 12,
      'GST_18': 18,
      'GST_28': 28,
      'EXEMPT': 0
    };
    this.taxRate = taxRates[this.taxCategory] || 18;
  }
  next();
});

// Instance method to update stock quantity
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  } else if (operation === 'add') {
    this.stockQuantity += quantity;
  }
  return this.stockQuantity;
};

// Instance method to record sale
productSchema.methods.recordSale = function(quantity, salePrice) {
  this.salesCount += quantity;
  this.totalRevenue += (salePrice || this.sellingPrice) * quantity;
  this.lastSoldDate = new Date();
  this.updateStock(quantity, 'subtract');
};

// Static method to find products needing reorder
productSchema.statics.findNeedingReorder = function() {
  return this.find({
    isActive: true,
    isDiscontinued: false,
    $expr: { $lte: ['$stockQuantity', '$reorderPoint'] }
  });
};

// Static method to find expiring products
productSchema.statics.findExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    isPerishable: true,
    expiryDate: {
      $lte: futureDate,
      $gte: new Date()
    }
  });
};

// Static method to find top selling products
productSchema.statics.findTopSelling = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ salesCount: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
