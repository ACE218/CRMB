import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Chip,
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
  Autocomplete,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { inventoryService, customerService, billService } from '../../services';
import { useAuthStore } from '../../store/authStore';

const BillingPage = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDialog, setCustomerDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get current user from auth store with loading state
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  // Add effect to handle auth loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  // Load products on component mount
  useEffect(() => {
    if (!isLoading) {
      loadProducts();
      loadCategoriesAndBrands();
    }
  }, [isLoading]);

  // Filter products when search/filter criteria change
  useEffect(() => {
    filterProducts();
  }, [products, productSearch, selectedCategory, selectedBrand]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getProducts({ inStock: 'true', limit: 200 });
      setProducts(response.data.products || []);
    } catch (error) {
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndBrands = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getBrands()
      ]);
      setCategories(categoriesRes.data.categories || []);
      setBrands(brandsRes.data.brands || []);
    } catch (error) {
      console.error('Error loading categories/brands:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search term
    if (productSearch.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.barcode && product.barcode.includes(productSearch))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by brand
    if (selectedBrand) {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }

    setFilteredProducts(filtered);
  };

  const searchByBarcode = async () => {
    if (!barcodeSearch.trim()) return;

    try {
      setLoading(true);
      const response = await inventoryService.searchByBarcode(barcodeSearch.trim());
      if (response.data.product) {
        addToCart(response.data.product);
        setBarcodeSearch('');
        showSnackbar(`Added ${response.data.product.name} to cart`, 'success');
      } else {
        showSnackbar('Product not found with this barcode', 'warning');
      }
    } catch (error) {
      showSnackbar('Error searching by barcode', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product._id === product._id);

    if (existingItem) {
      updateCartItem(existingItem.product._id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountPercentage: 0,
        discountAmount: 0,
        taxRate: 18, // Default GST rate
        taxAmount: 0,
        lineTotal: product.sellingPrice
      }]);
    }
  };

  const updateCartItem = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.product._id === productId) {
        const newQuantity = quantity;
        const subtotal = newQuantity * item.unitPrice;
        const discountAmount = (subtotal * item.discountPercentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.taxRate) / 100;
        const lineTotal = taxableAmount + taxAmount;

        return {
          ...item,
          quantity: newQuantity,
          discountAmount,
          taxAmount,
          lineTotal
        };
      }
      return item;
    }));
  };

  const updateDiscount = (productId, discountPercentage) => {
    setCart(cart.map(item => {
      if (item.product._id === productId) {
        const subtotal = item.quantity * item.unitPrice;
        const discountAmount = (subtotal * discountPercentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.taxRate) / 100;
        const lineTotal = taxableAmount + taxAmount;

        return {
          ...item,
          discountPercentage,
          discountAmount,
          taxAmount,
          lineTotal
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalTax = cart.reduce((sum, item) => sum + item.taxAmount, 0);
    const grandTotal = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, grandTotal };
  };

  const handleCreateCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerService.createCustomer(customerForm);
      setSelectedCustomer(response.data.customer);
      setCustomerSearch(`${response.data.customer.firstName} ${response.data.customer.lastName} (${response.data.customer.phone})`);
      setCustomerDialog(false);
      setCustomerForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        }
      });
      showSnackbar('Customer created successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error creating customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeBill = async () => {
    if (!selectedCustomer) {
      showSnackbar('Please select a customer', 'warning');
      return;
    }

    if (cart.length === 0) {
      showSnackbar('Please add items to cart', 'warning');
      return;
    }

    if (!user) {
      showSnackbar('Please login as an employee to create bills', 'error');
      return;
    }

    try {
      setLoading(true);
      const totals = calculateTotals();

      const billData = {
        customer: selectedCustomer._id,
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          discountPercentage: item.discountPercentage
        })),
        cashier: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Unknown Employee',
        paymentMethod: 'cash', // Default payment method
        notes: ''
      };

      const response = await billService.createBill(billData);
      showSnackbar('Bill created successfully', 'success');
      clearCart();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error creating bill', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const { subtotal, totalDiscount, totalTax, grandTotal } = calculateTotals();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon />
        Point of Sale - Billing System
      </Typography>

      <Grid container spacing={3}>
        {/* Product Selection */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Product Selection
            </Typography>

            {/* Search and Filter Controls */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Products"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by name, SKU, or barcode"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Scan Barcode"
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchByBarcode()}
                  placeholder="Enter barcode and press Enter"
                  InputProps={{
                    endAdornment: (
                      <Button
                        size="small"
                        onClick={searchByBarcode}
                        disabled={!barcodeSearch.trim() || loading}
                      >
                        Add
                      </Button>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
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
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
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
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredProducts.length} products
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    variant="outlined"
                  >
                    {showAllProducts ? 'Show Less' : 'Show All'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Product Grid */}
            <Grid container spacing={2}>
              {filteredProducts.slice(0, showAllProducts ? filteredProducts.length : 12).map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'scale(1.02)', boxShadow: 3 },
                      height: '100%'
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle2" noWrap sx={{ mb: 1, fontWeight: 600 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          SKU: {product.sku}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {product.category} • {product.brand}
                        </Typography>
                        {product.barcode && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            Barcode: {product.barcode}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="h6" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
                          ₹{product.sellingPrice}
                        </Typography>
                        <Chip
                          label={`${product.stockQuantity} ${product.unit}`}
                          size="small"
                          color={product.stockQuantity > product.reorderPoint ? 'success' : 'warning'}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          Click to add to cart
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredProducts.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {productSearch || selectedCategory || selectedBrand ? 'No products match your filters' : 'No products available'}
                </Typography>
                {(productSearch || selectedCategory || selectedBrand) && (
                  <Button
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setProductSearch('');
                      setSelectedCategory('');
                      setSelectedBrand('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {/* Cart */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartIcon />
              Cart ({cart.length} items)
            </Typography>

            {cart.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No items in cart. Click on products to add them.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Discount</TableCell>
                      <TableCell align="center">Tax</TableCell>
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product._id}>
                        <TableCell>
                          <Typography variant="body2">{item.product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.product.sku}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => updateCartItem(item.product._id, item.quantity - 1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography>{item.quantity}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateCartItem(item.product._id, item.quantity + 1)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="center">₹{item.unitPrice}</TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.discountPercentage}
                            onChange={(e) => updateDiscount(item.product._id, parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ width: 60 }}
                          />
                          %
                        </TableCell>
                        <TableCell align="center">{item.taxRate}%</TableCell>
                        <TableCell align="center">₹{item.lineTotal.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(item.product._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Customer & Billing Summary */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Customer Selection */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Customer Details
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Search by Phone Number"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onBlur={() => searchCustomers(customerSearch.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit phone number"
                />
                <Button
                  variant="outlined"
                  onClick={() => setCustomerDialog(true)}
                  startIcon={<PersonAddIcon />}
                >
                  New
                </Button>
              </Box>

              {selectedCustomer && (
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="subtitle1">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCustomer.phone} | {selectedCustomer.email}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Paper>

            {/* Billing Summary */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Bill Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>₹{subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Discount:</Typography>
                  <Typography color="success.main">-₹{totalDiscount.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax (GST):</Typography>
                  <Typography>₹{totalTax.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Grand Total:</Typography>
                  <Typography variant="h6" color="primary">₹{grandTotal.toFixed(2)}</Typography>
                </Box>
              </Box>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleFinalizeBill}
                  disabled={!selectedCustomer || cart.length === 0 || loading}
                  startIcon={<ReceiptIcon />}
                >
                  Finalize Bill
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Clear Cart
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Customer Creation Dialog */}
      <Dialog open={customerDialog} onClose={() => setCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={customerForm.firstName}
                onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={customerForm.lastName}
                onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                required
                helperText="10-digit phone number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={customerForm.address.street}
                onChange={(e) => setCustomerForm({
                  ...customerForm,
                  address: { ...customerForm.address, street: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={customerForm.address.city}
                onChange={(e) => setCustomerForm({
                  ...customerForm,
                  address: { ...customerForm.address, city: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                value={customerForm.address.state}
                onChange={(e) => setCustomerForm({
                  ...customerForm,
                  address: { ...customerForm.address, state: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={customerForm.address.zipCode}
                onChange={(e) => setCustomerForm({
                  ...customerForm,
                  address: { ...customerForm.address, zipCode: e.target.value }
                })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={loading || !customerForm.firstName || !customerForm.lastName || !customerForm.phone || !customerForm.email}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default BillingPage;
