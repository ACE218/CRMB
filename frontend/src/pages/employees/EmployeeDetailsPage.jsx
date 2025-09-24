import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactPhoneIcon,
  Work as WorkIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { employeeService } from '../../services';

const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch employee details
  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployee(id);
      setEmployee(response.data.data.employee);
    } catch (err) {
      setError('Failed to fetch employee details');
      console.error('Fetch employee error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  // Open edit dialog
  const openEdit = () => {
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
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
    setOpenEditDialog(true);
  };

  // Handle update
  const handleUpdate = async () => {
    try {
      setLoading(true);
      await employeeService.updateEmployee(id, formData);
      setSuccess('Employee updated successfully');
      setOpenEditDialog(false);
      fetchEmployee();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Employee not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
          Employee Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={openEdit}
        >
          Edit Employee
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', pb: 3 }}>
              <Avatar 
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
              >
                <PersonIcon sx={{ fontSize: 50 }} />
              </Avatar>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {employee.fullName}
              </Typography>
              
              <Chip 
                icon={<BadgeIcon />}
                label={employee.employeeId}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={employee.isActive ? 'Active' : 'Inactive'}
                  color={employee.isActive ? 'success' : 'error'}
                  size="small"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon sx={{ fontSize: 16, color: 'orange' }} />
                  <Typography variant="body2">
                    Rating: {employee.performanceRating || 'N/A'}/5
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{employee.email}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{employee.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {employee.address && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Address</Typography>
                        <Typography variant="body1">
                          {employee.address.street}
                          {employee.address.city && `, ${employee.address.city}`}
                          {employee.address.state && `, ${employee.address.state}`}
                          {employee.address.zipCode && ` - ${employee.address.zipCode}`}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WorkIcon sx={{ mr: 1 }} />
                Employment Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Department</Typography>
                  <Chip 
                    label={employee.department?.charAt(0).toUpperCase() + employee.department?.slice(1)}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Position</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{employee.position}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                  <Chip 
                    label={employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1)}
                    color={employee.role === 'admin' ? 'error' : employee.role === 'manager' ? 'warning' : 'default'}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Salary</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    ₹{employee.salary?.toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Hire Date</Typography>
                  <Typography variant="body1">
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                  <Typography variant="body1">
                    ₹{employee.totalSales?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ContactPhoneIcon sx={{ mr: 1 }} />
                  Emergency Contact
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{employee.emergencyContact.name}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{employee.emergencyContact.phone}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Relationship</Typography>
                    <Typography variant="body1">{employee.emergencyContact.relationship}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {employee.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Notes</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">{employee.notes}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
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
                  value={formData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  label="Department"
                >
                  {['sales', 'marketing', 'hr', 'finance', 'operations', 'it', 'management'].map(dept => (
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
                value={formData.position || ''}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={formData.salary || ''}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  label="Role"
                >
                  {['staff', 'manager', 'admin'].map(role => (
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
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                value={formData.performanceRating || ''}
                onChange={(e) => handleInputChange('performanceRating', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update'}
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

export default EmployeeDetailsPage;