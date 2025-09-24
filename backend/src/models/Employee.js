const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
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
      required: [true, 'Zip code is required'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit zip code']
    }
  },

  // Employee Specific Information
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['sales', 'marketing', 'hr', 'finance', 'operations', 'it', 'management'],
    lowercase: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  employeeId: {
    type: String,
    unique: true,
    trim: true
  },

  // Performance Metrics
  totalSales: {
    type: Number,
    default: 0,
    min: [0, 'Total sales cannot be negative']
  },
  totalCustomers: {
    type: Number,
    default: 0,
    min: [0, 'Total customers cannot be negative']
  },
  performanceRating: {
    type: Number,
    min: [0, 'Performance rating cannot be less than 0'],
    max: [5, 'Performance rating cannot be more than 5'],
    default: 0
  },

  // Authentication & Authorization
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['staff', 'manager', 'admin'],
    default: 'staff'
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'admin']
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isStaff: {
    type: Boolean,
    default: true
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    }
  },

  // Important Dates
  hireDate: {
    type: Date,
    required: [true, 'Hire date is required'],
    default: Date.now
  }
}, {
  timestamps: true, // This will add createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
employeeSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    try {
      // Find the highest employee number
      const lastEmployee = await this.constructor.findOne(
        { employeeId: { $regex: /^EMP\d+$/ } },
        {},
        { sort: { employeeId: -1 } }
      );
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeId) {
        const lastNumber = parseInt(lastEmployee.employeeId.replace('EMP', ''));
        nextNumber = lastNumber + 1;
      }
      
      this.employeeId = `EMP${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to check password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by employee ID
employeeSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId: employeeId });
};

// Index for better query performance
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;