import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Inventory,
  Warning,
  TrendingUp,
  Category,
  LocalOffer,
  QrCodeScanner,
  Refresh,
  FilterList,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { inventoryService } from '../../services';

const InventoryPage = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: '',
    subcategory: '',
    brand: '',
    basePrice: '',
    sellingPrice: '',
    costPrice: '',
    discountPercentage: 0,
    taxCategory: 'GST_18',
    stockQuantity: '',
    minStockLevel: 10,
    maxStockLevel: 1000,
    reorderPoint: 20,
    unit: 'piece',
    isActive: true,
    isPerishable: false
  });

  // UI states
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, []);

  // Load products with filters
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        lowStock: showLowStock || undefined
      };

      const response = await inventoryService.getProducts(params);

      const productsData = response.data?.data?.products || [];
      const totalCountData = response.data?.data?.pagination?.totalCount || 0;

      setProducts(productsData);
      setTotalCount(totalCountData);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setTotalCount(0);
      setSnackbar({
        open: true,
        message: `Failed to load products: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load categories and brands
  const loadCategories = async () => {
    try {
      const response = await inventoryService.getCategories();
      setCategories(response.data?.data?.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set default categories if API fails
      setCategories([
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
      ]);
      setSnackbar({
        open: true,
        message: 'Using default categories - some features may be limited',
        severity: 'warning'
      });
    }
  };

  const loadBrands = async () => {
    try {
      const response = await inventoryService.getBrands();
      setBrands(response.data?.data?.brands || []);
    } catch (error) {
      console.error('Error loading brands:', error);
      // Set default brands if API fails
      setBrands([
        'Local Brand',
        'Generic',
        'Other'
      ]);
      setSnackbar({
        open: true,
        message: 'Using default brands - some features may be limited',
        severity: 'warning'
      });
    }
  };

  // Handle search and filters
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadProducts();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, selectedBrand, showLowStock, page, rowsPerPage]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Open create dialog
  const openCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category: '',
      subcategory: '',
      brand: '',
      basePrice: '',
      sellingPrice: '',
      costPrice: '',
      discountPercentage: 0,
      taxCategory: 'GST_18',
      stockQuantity: '',
      minStockLevel: 10,
      maxStockLevel: 1000,
      reorderPoint: 20,
      unit: 'piece',
      isActive: true,
      isPerishable: false
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (product) => {
    setDialogMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand,
      basePrice: product.basePrice?.toString() || '',
      sellingPrice: product.sellingPrice?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      discountPercentage: product.discountPercentage || 0,
      taxCategory: product.taxCategory,
      stockQuantity: product.stockQuantity?.toString() || '',
      minStockLevel: product.minStockLevel || 10,
      maxStockLevel: product.maxStockLevel || 1000,
      reorderPoint: product.reorderPoint || 20,
      unit: product.unit,
      isActive: product.isActive,
      isPerishable: product.isPerishable
    });
    setOpenDialog(true);
  };

  // Handle save
  const handleSave = async () => {
    // Basic client-side validation
    if (!formData.name?.trim()) {
      setSnackbar({
        open: true,
        message: 'Product name is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.sku?.trim()) {
      setSnackbar({
        open: true,
        message: 'SKU is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.category) {
      setSnackbar({
        open: true,
        message: 'Category is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.brand) {
      setSnackbar({
        open: true,
        message: 'Brand is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      setSnackbar({
        open: true,
        message: 'Valid base price is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      setSnackbar({
        open: true,
        message: 'Valid selling price is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      setSnackbar({
        open: true,
        message: 'Valid cost price is required',
        severity: 'error'
      });
      return;
    }
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      setSnackbar({
        open: true,
        message: 'Valid stock quantity is required',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 10,
        maxStockLevel: parseInt(formData.maxStockLevel) || 1000,
        reorderPoint: parseInt(formData.reorderPoint) || 20
      };

      if (dialogMode === 'create') {
        await inventoryService.createProduct(submitData);
        setSnackbar({
          open: true,
          message: 'Product created successfully',
          severity: 'success'
        });
      } else {
        await inventoryService.updateProduct(selectedProduct._id, submitData);
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success'
        });
      }

      setOpenDialog(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save product',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await inventoryService.deleteProduct(productId);
        setSnackbar({
          open: true,
          message: 'Product deleted successfully',
          severity: 'success'
        });
        loadProducts(); // Refresh the product list
      } catch (error) {
        console.error('Error deleting product:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to delete product. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get stock status
  const getStockStatus = (product) => {
    if (!product) return { status: 'Unknown', color: 'default' };

    const stockQuantity = product.stockQuantity || 0;
    const reorderPoint = product.reorderPoint || 0;
    const maxStockLevel = product.maxStockLevel || 1000;

    if (stockQuantity === 0) return { status: 'Out of Stock', color: 'error' };
    if (stockQuantity <= reorderPoint) return { status: 'Low Stock', color: 'warning' };
    if (stockQuantity >= maxStockLevel) return { status: 'Overstock', color: 'info' };
    return { status: 'In Stock', color: 'success' };
  };

  // Calculate total value
  const totalValue = products?.reduce((sum, product) => {
    const price = product?.sellingPrice || 0;
    const quantity = product?.stockQuantity || 0;
    return sum + (price * quantity);
  }, 0) || 0;

  const lowStockCount = products?.filter(product =>
    (product?.stockQuantity || 0) <= (product?.reorderPoint || 0)
  ).length || 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadProducts} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {totalCount}
                  </Typography>
                </Box>
                <Inventory color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h4">
                    ₹{(totalValue || 0).toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {lowStockCount}
                  </Typography>
                </Box>
                <Badge badgeContent={lowStockCount} color="warning">
                  <Warning sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Categories
                  </Typography>
                  <Typography variant="h4">
                    {categories.length}
                  </Typography>
                </Box>
                <Category color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                label="Brand"
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                />
              }
              label="Low Stock Only"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Products ({totalCount})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setViewMode('table')}
            color={viewMode === 'table' ? 'primary' : 'default'}
          >
            <ViewList />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('card')}
            color={viewMode === 'card' ? 'primary' : 'default'}
          >
            <ViewModule />
          </IconButton>
        </Box>
      </Box>

      {/* Products Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'table' ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products?.map((product) => {
                  if (!product) return null;
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product._id || product.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name || 'N/A'}
                          </Typography>
                          {product.description && (
                            <Typography variant="caption" color="textSecondary">
                              {product.description.length > 50
                                ? `${product.description.substring(0, 50)}...`
                                : product.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{product.sku || 'N/A'}</TableCell>
                      <TableCell>{product.category || 'N/A'}</TableCell>
                      <TableCell>{product.brand || 'N/A'}</TableCell>
                      <TableCell align="right">
                        ₹{(product.sellingPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {product.stockQuantity || 0} {product.unit || 'pcs'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stockStatus.status}
                          color={stockStatus.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(product)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(product._id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {products?.map((product) => {
            if (!product) return null;
            const stockStatus = getStockStatus(product);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id || product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {product.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {product.sku || 'N/A'}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={product.category || 'N/A'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Brand: {product.brand || 'N/A'}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{(product.sellingPrice || 0).toFixed(2)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Stock: {product.stockQuantity || 0} {product.unit || 'pcs'}
                      </Typography>
                      <Chip
                        label={stockStatus.status}
                        color={stockStatus.color}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => openEditDialog(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      color="error"
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Product Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Product' : 'Edit Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                required
                helperText="Unique product identifier"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
              />
            </Grid>

            {/* Categorization */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Categorization</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  label="Brand"
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Pricing */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Pricing</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cost Price"
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', e.target.value)}
                required
                InputProps={{ startAdornment: <Typography>₹</Typography> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                required
                InputProps={{ startAdornment: <Typography>₹</Typography> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Base Price"
                type="number"
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', e.target.value)}
                required
                InputProps={{ startAdornment: <Typography>₹</Typography> }}
              />
            </Grid>

            {/* Inventory */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Inventory</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                required
                InputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  label="Unit"
                >
                  <MenuItem value="piece">Piece</MenuItem>
                  <MenuItem value="kg">Kilogram</MenuItem>
                  <MenuItem value="gram">Gram</MenuItem>
                  <MenuItem value="liter">Liter</MenuItem>
                  <MenuItem value="ml">Milliliter</MenuItem>
                  <MenuItem value="meter">Meter</MenuItem>
                  <MenuItem value="cm">Centimeter</MenuItem>
                  <MenuItem value="dozen">Dozen</MenuItem>
                  <MenuItem value="pack">Pack</MenuItem>
                  <MenuItem value="box">Box</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Min Stock Level"
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                InputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Stock Level"
                type="number"
                value={formData.maxStockLevel}
                onChange={(e) => handleInputChange('maxStockLevel', e.target.value)}
                InputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => handleInputChange('reorderPoint', e.target.value)}
                InputProps={{ min: 0 }}
              />
            </Grid>

            {/* Tax */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Tax Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tax Category</InputLabel>
                <Select
                  value={formData.taxCategory}
                  onChange={(e) => handleInputChange('taxCategory', e.target.value)}
                  label="Tax Category"
                >
                  <MenuItem value="GST_0">GST 0%</MenuItem>
                  <MenuItem value="GST_5">GST 5%</MenuItem>
                  <MenuItem value="GST_12">GST 12%</MenuItem>
                  <MenuItem value="GST_18">GST 18%</MenuItem>
                  <MenuItem value="GST_28">GST 28%</MenuItem>
                  <MenuItem value="EXEMPT">Exempt</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Status</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPerishable}
                    onChange={(e) => handleInputChange('isPerishable', e.target.checked)}
                  />
                }
                label="Perishable"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : (dialogMode === 'create' ? 'Create' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;
