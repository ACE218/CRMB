const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protectEmployee } = require('../middleware/employeeAuth');

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

// @desc    Get all products with pagination and filtering
// @route   GET /api/inventory
// @access  Public (for browsing) / Private (for management)
router.get('/', [
  query('page')
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .toInt()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'price', 'stockQuantity'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('category')
    .optional()
    .trim(),
  query('brand')
    .optional()
    .trim(),
  query('minPrice')
    .optional()
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('inStock')
    .optional()
    .isString()
    .matches(/^(true|false)$/)
    .withMessage('inStock must be "true" or "false"'),
  query('lowStock')
    .optional()
    .isString()
    .matches(/^(true|false)$/)
    .withMessage('lowStock must be "true" or "false"')
], validateRequest, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      filter.stockQuantity = { $gt: 0 };
    } else if (inStock === 'false') {
      filter.stockQuantity = 0;
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stockQuantity', '$reorderPoint'] };
    }

    // Build sort object
    const sort = {};
    if (search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        products,
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @desc    Get product by ID
// @route   GET /api/inventory/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is not available'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @desc    Create new product
// @route   POST /api/inventory
// @access  Private (Staff only)
router.post('/', protectEmployee, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('sku')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('SKU must be between 3 and 20 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required'),
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('unit')
    .isIn(['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'dozen', 'pack', 'box', 'bottle'])
    .withMessage('Invalid unit')
], validateRequest, async (req, res) => {
  try {
    // Check if SKU already exists among active products
    const existingProduct = await Product.findOne({ sku: req.body.sku.toUpperCase(), isActive: true });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    // Handle empty barcode to avoid duplicate key error
    if (req.body.barcode === "") {
      req.body.barcode = undefined;
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @desc    Update product
// @route   PUT /api/inventory/:id
// @access  Private (Staff only)
router.put('/:id', protectEmployee, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100')
], validateRequest, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // If updating SKU, check for duplicates among active products
    if (req.body.sku) {
      const duplicate = await Product.findOne({
        sku: req.body.sku.toUpperCase(),
        _id: { $ne: req.params.id },
        isActive: true
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }

    // Update product fields manually to avoid validation issues
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    // Handle empty barcode to avoid duplicate key error
    if (req.body.barcode === "") {
      product.barcode = undefined;
    }

    // Ensure SKU is uppercase if provided
    if (req.body.sku) {
      product.sku = req.body.sku.toUpperCase();
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @desc    Delete product (deactivate)
// @route   DELETE /api/inventory/:id
// @access  Private (Staff only)
router.delete('/:id', protectEmployee, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Instead of deleting, deactivate the product
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating product',
      error: error.message
    });
  }
});

// @desc    Update product stock
// @route   PUT /api/inventory/:id/stock
// @access  Private (Staff only)
router.put('/:id/stock', protectEmployee, [
  body('quantity')
    .isInt()
    .withMessage('Quantity must be an integer'),
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
    const { quantity, operation, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousStock = product.stockQuantity;
    let newStock = previousStock;

    switch (operation) {
      case 'add':
        newStock += quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, newStock - quantity);
        break;
      case 'set':
        newStock = Math.max(0, quantity);
        break;
    }

    product.stockQuantity = newStock;
    await product.save();

    // Log the stock transaction (in a real app, you might have a separate model for this)
    console.log(`Stock ${operation}: Product ${product.sku}, Quantity: ${quantity}, Previous: ${previousStock}, New: ${newStock}, Reason: ${reason || 'Manual adjustment'}`);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          previousStock,
          currentStock: newStock,
          stockStatus: product.stockStatus
        },
        operation,
        quantityChanged: quantity,
        reason
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
});

// @desc    Get products needing reorder
// @route   GET /api/inventory/alerts/reorder
// @access  Private (Staff only)
router.get('/alerts/reorder', protectEmployee, async (req, res) => {
  try {
    const products = await Product.findNeedingReorder();

    res.json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
  } catch (error) {
    console.error('Get reorder alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reorder alerts',
      error: error.message
    });
  }
});

// @desc    Get expiring products
// @route   GET /api/inventory/alerts/expiring
// @access  Private (Staff only)
router.get('/alerts/expiring', protectEmployee, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30')
], validateRequest, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const products = await Product.findExpiringSoon(days);

    res.json({
      success: true,
      data: {
        products,
        count: products.length,
        daysAhead: days
      }
    });
  } catch (error) {
    console.error('Get expiring alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring products',
      error: error.message
    });
  }
});

// @desc    Get top selling products
// @route   GET /api/inventory/reports/top-selling
// @access  Private
router.get('/reports/top-selling', protectEmployee, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], validateRequest, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.findTopSelling(limit);

    res.json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
  } catch (error) {
    console.error('Get top selling products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top selling products',
      error: error.message
    });
  }
});

// @desc    Get product categories
// @route   GET /api/inventory/categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: {
        categories: categories.sort()
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// @desc    Get product brands
// @route   GET /api/inventory/brands
// @access  Public
router.get('/meta/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    
    res.json({
      success: true,
      data: {
        brands: brands.sort()
      }
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brands',
      error: error.message
    });
  }
});

// @desc    Search products by barcode
// @route   GET /api/inventory/search/barcode/:barcode
// @access  Private (Staff only)
router.get('/search/barcode/:barcode', protectEmployee, async (req, res) => {
  try {
    const product = await Product.findOne({
      barcode: req.params.barcode,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this barcode'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Barcode search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching by barcode',
      error: error.message
    });
  }
});

module.exports = router;
