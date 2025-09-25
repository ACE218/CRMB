const express = require('express');
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const { generateEmployeeToken, protectEmployee } = require('../middleware/employeeAuth');

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

// @desc    Login employee
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if employee exists and get password
    const employee = await Employee.findOne({ email }).select('+password');

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!employee.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await employee.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateEmployeeToken(employee._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        employee: {
          id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          position: employee.position,
          role: employee.role,
          employeeId: employee.employeeId
        },
        token
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// @desc    Get current employee profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protectEmployee, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName,
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
          department: employee.department,
          position: employee.position,
          salary: employee.salary,
          employeeId: employee.employeeId,
          role: employee.role,
          performanceRating: employee.performanceRating,
          emergencyContact: employee.emergencyContact,
          hireDate: employee.hireDate,
          createdAt: employee.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Employee profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

module.exports = router;
