import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { employeeService } from '../../services';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    department: '',
    position: '',
    salary: '',
    role: 'staff',
    performanceRating: '',
    notes: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    isActive: true
  });

  // Departments and roles
  const departments = ['sales', 'marketing', 'hr', 'finance', 'operations', 'it', 'management'];
  const roles = ['staff', 'manager', 'admin'];

  // Form validation
  const validateForm = () => {
    const errors = [];

    // Required fields validation
    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone is required');
    if (!formData.address.street.trim()) errors.push('Street address is required');
    if (!formData.address.city.trim()) errors.push('City is required');
    if (!formData.address.state.trim()) errors.push('State is required');
    if (!formData.address.zipCode.trim()) errors.push('ZIP code is required');
    if (!formData.department) errors.push('Department is required');
    if (!formData.position.trim()) errors.push('Position is required');
    if (!formData.salary) errors.push('Salary is required');
    if (!formData.emergencyContact.name.trim()) errors.push('Emergency contact name is required');
    if (!formData.emergencyContact.phone.trim()) errors.push('Emergency contact phone is required');
    if (!formData.emergencyContact.relationship.trim()) errors.push('Emergency contact relationship is required');

    // Format validation
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.push('Phone must be exactly 10 digits');
    }
    if (formData.address.zipCode && !/^[0-9]{6}$/.test(formData.address.zipCode)) {
      errors.push('ZIP code must be exactly 6 digits');
    }
    if (formData.emergencyContact.phone && !/^[0-9]{10}$/.test(formData.emergencyContact.phone)) {
      errors.push('Emergency contact phone must be exactly 10 digits');
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) <= 0)) {
      errors.push('Salary must be a positive number');
    }
    if (formData.performanceRating && (isNaN(formData.performanceRating) || parseFloat(formData.performanceRating) < 0 || parseFloat(formData.performanceRating) > 5)) {
      errors.push('Performance rating must be between 0 and 5');
    }

    return errors;
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(activeFilter !== '' && { isActive: activeFilter })
      };

      const response = await employeeService.getEmployees(params);
      setEmployees(response.data.data.employees);
      setTotalCount(response.data.data.pagination.totalCount);
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, rowsPerPage, searchTerm, departmentFilter, roleFilter, activeFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchEmployees();
  };

  // Handle create/edit employee
  const handleSave = async () => {
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare data for submission
      const submitData = {
        ...formData,
        salary: parseFloat(formData.salary),
        performanceRating: formData.performanceRating ? parseFloat(formData.performanceRating) : undefined
      };

      // Remove password from update data for security
      if (dialogMode === 'edit') {
        delete submitData.password;
      }

      if (dialogMode === 'create') {
        await employeeService.createEmployee(submitData);
        setSuccess('Employee created successfully');
      } else {
        await employeeService.updateEmployee(selectedEmployee._id, submitData);
        setSuccess('Employee updated successfully');
      }
      
      setOpenDialog(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save employee';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete employee
  const handleDelete = async (employee) => {
    if (window.confirm(`Are you sure you want to permanently delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await employeeService.deleteEmployee(employee._id);
        setSuccess('Employee deleted successfully from database');
        fetchEmployees();
      } catch (err) {
        setError('Failed to delete employee');
      } finally {
        setLoading(false);
      }
    }
  };

  // Dialog handlers
  const openCreateDialog = () => {
    setDialogMode('create');
    resetForm();
    setError('');
    setOpenDialog(true);
  };

  const openEditDialog = (employee) => {
    setDialogMode('edit');
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      password: '', // Not shown in edit mode for security
      address: {
        street: employee.address?.street || '',
        city: employee.address?.city || '',
        state: employee.address?.state || '',
        zipCode: employee.address?.zipCode || ''
      },
      department: employee.department,
      position: employee.position,
      salary: employee.salary,
      role: employee.role,
      performanceRating: employee.performanceRating || '',
      notes: employee.notes || '',
      emergencyContact: {
        name: employee.emergencyContact?.name || '',
        phone: employee.emergencyContact?.phone || '',
        relationship: employee.emergencyContact?.relationship || ''
      },
      isActive: employee.isActive
    });
    setError('');
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      department: '',
      position: '',
      salary: '',
      role: 'staff',
      performanceRating: '',
      notes: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      isActive: true
    });
    setSelectedEmployee(null);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Employee Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchEmployees}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            color="primary"
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Department"
              >
                <MenuItem value="">All</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Employee Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {employee.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <EmailIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {employee.email}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            <PhoneIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {employee.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<BadgeIcon />}
                        label={employee.employeeId}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.department?.charAt(0).toUpperCase() + employee.department?.slice(1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1)}
                        size="small"
                        color={employee.role === 'admin' ? 'error' : employee.role === 'manager' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon sx={{ fontSize: 16, color: 'orange' }} />
                        {employee.performanceRating || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        color={employee.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(employee)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Employee">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(employee)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Employee' : 'Edit Employee'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone (10 digits)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                inputProps={{ maxLength: 10, pattern: '[0-9]{10}' }}
                helperText="Enter 10-digit mobile number"
              />
            </Grid>
            
            {dialogMode === 'create' && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  inputProps={{ minLength: 6 }}
                  helperText="Minimum 6 characters"
                />
              </Grid>
            )}

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Address</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="ZIP Code (6 digits)"
                value={formData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                required
                inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }}
                helperText="Enter 6-digit ZIP code"
              />
            </Grid>

            {/* Employment Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Employment Information</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  label="Department"
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  label="Role"
                >
                  {roles.map(role => (
                    <MenuItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Performance Rating (0-5)"
                type="number"
                value={formData.performanceRating}
                onChange={(e) => handleInputChange('performanceRating', e.target.value)}
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                helperText="Optional: Rate from 0 to 5"
              />
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Emergency Contact</Typography>
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={formData.emergencyContact.name}
                onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Emergency Contact Phone (10 digits)"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                required
                inputProps={{ maxLength: 10, pattern: '[0-9]{10}' }}
                helperText="Enter 10-digit mobile number"
              />
            </Grid>
            
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (dialogMode === 'create' ? 'Create' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeesPage;