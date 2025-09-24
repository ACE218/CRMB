const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
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

// @desc    Get all employees with pagination and filtering
// @route   GET /api/employees
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
  query('department')
    .optional()
    .isIn(['sales', 'marketing', 'hr', 'finance', 'operations', 'it', 'management'])
    .withMessage('Invalid department'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('role')
    .optional()
    .isIn(['staff', 'manager', 'admin'])
    .withMessage('Invalid role')
], validateRequest, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      department,
      isActive,
      role,
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
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      filter.department = department;
    }

    if (role) {
      filter.role = role;
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
    const [employees, totalCount] = await Promise.all([
      Employee.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      Employee.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        employees,
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
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: {
        employee
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
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
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Please provide a valid 6-digit ZIP code'),
  body('department')
    .isIn(['sales', 'marketing', 'hr', 'finance', 'operations', 'it', 'management'])
    .withMessage('Invalid department'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required'),
  body('salary')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  body('emergencyContact.name')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact name is required'),
  body('emergencyContact.phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid emergency contact phone number'),
  body('emergencyContact.relationship')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact relationship is required')
], validateRequest, async (req, res) => {
  try {
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }]
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email or phone already exists'
      });
    }

    // Create new employee
    const employee = new Employee(req.body);
    await employee.save();

    // Return employee without password
    const employeeResponse = await Employee.findById(employee._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee: employeeResponse
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
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
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number'),
  body('department')
    .optional()
    .isIn(['sales', 'marketing', 'hr', 'finance', 'operations', 'it', 'management'])
    .withMessage('Invalid department'),
  body('position')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Position cannot be empty'),
  body('salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  body('role')
    .optional()
    .isIn(['staff', 'manager', 'admin'])
    .withMessage('Invalid role'),
  body('performanceRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Performance rating must be between 0 and 5')
], validateRequest, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if email or phone already exists (excluding current employee)
    if (req.body.email || req.body.phone) {
      const existingEmployee = await Employee.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(req.body.email ? [{ email: req.body.email }] : []),
          ...(req.body.phone ? [{ phone: req.body.phone }] : [])
        ]
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this email or phone already exists'
        });
      }
    }

    // Update employee
    Object.keys(req.body).forEach(key => {
      if (key === 'address' && req.body[key]) {
        employee.address = { ...employee.address, ...req.body[key] };
      } else if (key === 'emergencyContact' && req.body[key]) {
        employee.emergencyContact = { ...employee.emergencyContact, ...req.body[key] };
      } else {
        employee[key] = req.body[key];
      }
    });

    await employee.save();

    // Return updated employee without password
    const updatedEmployee = await Employee.findById(employee._id).select('-password');

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        employee: updatedEmployee
      }
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Soft delete by setting isActive to false
    employee.isActive = false;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee deactivated successfully',
      data: {
        employee: await Employee.findById(employee._id).select('-password')
      }
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
});

// @desc    Get employee statistics
// @route   GET /api/employees/stats/overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      departmentStats,
      roleStats,
      topPerformers
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ isActive: true }),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Employee.find({ isActive: true })
        .sort({ performanceRating: -1 })
        .limit(5)
        .select('firstName lastName employeeId department performanceRating totalSales')
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees
        },
        departmentStats,
        roleStats,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee statistics',
      error: error.message
    });
  }
});

module.exports = router;