import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Territory } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { showToast } from '../components/ui';
import { UserPlus, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validators } from '../utils/validation';

export function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [territories, setTerritories] = useState<Territory[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'FIELD_REP' as 'ADMIN' | 'MANAGER' | 'FIELD_REP',
    territoryId: '',
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Fetch territories for assignment
  useEffect(() => {
    fetchTerritories();
  }, []);

  // Fetch user data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchUser();
    }
  }, [isEditMode, id]);

  const fetchTerritories = async () => {
    try {
      const response = await api.getTerritories({ limit: 100, isActive: 'true' });
      if (response.success && response.data) {
        setTerritories(response.data.territories);
      }
    } catch (error) {
      console.error('Failed to fetch territories:', error);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.getUser(id!);

      if (response.success && response.data) {
        const user = response.data.user;
        setFormData({
          name: user.name,
          email: user.email,
          password: '',
          confirmPassword: '',
          phone: user.phone || '',
          role: user.role as 'ADMIN' | 'MANAGER' | 'FIELD_REP',
          territoryId: (user as any).territoryId || '',
        });
      } else {
        setError(response.error || 'Failed to fetch user');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        return validators.required(value, 'Name') || validators.minLength(value, 2, 'Name');
      case 'email':
        return validators.required(value, 'Email') || validators.email(value);
      case 'password':
        if (!isEditMode && !value) return 'Password is required';
        if (value && value.length < 8) return 'Password must be at least 8 characters';
        return '';
      case 'confirmPassword':
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        return '';
      case 'phone':
        if (value) return validators.phone(value);
        return '';
      case 'role':
        return validators.required(value, 'Role');
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    errors.name = validateField('name', formData.name);
    errors.email = validateField('email', formData.email);
    errors.password = validateField('password', formData.password);
    errors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    if (formData.phone) errors.phone = validateField('phone', formData.phone);
    errors.role = validateField('role', formData.role);

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const value = formData[field as keyof typeof formData];
    const error = validateField(field, value);
    if (error) {
      setFieldErrors({ ...fieldErrors, [field]: error });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      setTouched({ name: true, email: true, password: true, confirmPassword: true, role: true });
      return;
    }

    try {
      setSubmitting(true);

      const userData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        territoryId: formData.territoryId || undefined,
      };

      // Only include password if provided
      if (formData.password) {
        userData.password = formData.password;
      }

      let response;
      if (isEditMode) {
        response = await api.updateUser(id!, userData);
      } else {
        response = await api.createUser({
          ...userData,
          password: formData.password,
        });
      }

      if (response.success) {
        showToast.success(
          isEditMode ? 'User updated successfully' : 'User created successfully',
          `${formData.name} has been ${isEditMode ? 'updated' : 'added'} to the system`
        );
        navigate('/users');
      } else {
        const errorMsg = response.error || `Failed to ${isEditMode ? 'update' : 'create'} user`;
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || `Failed to ${isEditMode ? 'update' : 'create'} user`;
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };


  if (currentUser && currentUser.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <PageContainer>
        <ContentSection>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                {isEditMode ? 'Edit User' : 'Create New User'}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {isEditMode ? 'Update user information' : 'Add a new user to the system'}
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <div className="mt-6 max-w-2xl">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  required
                  className={`input-field ${touched.name && fieldErrors.name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="John Doe"
                />
                {touched.name && fieldErrors.name && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  required
                  className={`input-field ${touched.email && fieldErrors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="john.doe@example.com"
                />
                {touched.email && fieldErrors.email && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  className={`input-field ${touched.phone && fieldErrors.phone ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="+1234567890"
                />
                {touched.phone && fieldErrors.phone && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="select-field"
                >
                  <option value="FIELD_REP">Field Representative</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="mt-1 text-sm text-neutral-500">
                  {formData.role === 'ADMIN' && 'Full system access with user management capabilities'}
                  {formData.role === 'MANAGER' && 'Can view all data and manage team members'}
                  {formData.role === 'FIELD_REP' && 'Can manage own contacts, visits, and orders'}
                </p>
              </div>

              {/* Territory */}
              <div>
                <label htmlFor="territoryId" className="block text-sm font-medium text-neutral-700 mb-1">
                  Territory
                </label>
                <select
                  id="territoryId"
                  name="territoryId"
                  value={formData.territoryId}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="">No Territory Assigned</option>
                  {territories.map(territory => (
                    <option key={territory.id} value={territory.id}>
                      {territory.name} ({territory.code}) - {territory.type}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-neutral-500">
                  Assign user to a geographic territory for data filtering and reporting
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                  Password {isEditMode ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  required={!isEditMode}
                  className={`input-field ${touched.password && fieldErrors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="••••••••"
                  minLength={8}
                />
                {touched.password && fieldErrors.password && (
                  <p className="mt-1 text-sm text-danger-600">{fieldErrors.password}</p>
                )}
                {!fieldErrors.password && (
                  <p className="mt-1 text-sm text-neutral-500">
                    Must be at least 8 characters
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              {(formData.password || !isEditMode) && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    required={!isEditMode || !!formData.password}
                    className={`input-field ${touched.confirmPassword && fieldErrors.confirmPassword ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-danger-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      </ContentSection>
    </PageContainer>
  );
}
