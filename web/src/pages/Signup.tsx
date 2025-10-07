import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validators } from '../utils/validation';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        return validators.required(value, 'Name') || validators.minLength(value, 2, 'Name');
      case 'email':
        return validators.required(value, 'Email') || validators.email(value);
      case 'phone':
        if (value) return validators.phone(value);
        return '';
      case 'password':
        const requiredError = validators.required(value, 'Password');
        if (requiredError) return requiredError;
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
      case 'confirmPassword':
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.name = validateField('name', formData.name);
    errors.email = validateField('email', formData.email);
    if (formData.phone) errors.phone = validateField('phone', formData.phone);
    errors.password = validateField('password', formData.password);
    errors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
      return;
    }

    setLoading(true);

    try {
      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg" role="main">
        <div>
          <h1 className="text-3xl font-bold text-center text-primary-800">
            Field Force CRM
          </h1>
          <p className="mt-2 text-center text-neutral-600">
            Create your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-label="Signup form">
          {error && (
            <div
              className="error-message"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-900">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`input-field mt-1 ${touched.name && fieldErrors.name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
              />
              {touched.name && fieldErrors.name && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`input-field mt-1 ${touched.email && fieldErrors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-900">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`input-field mt-1 ${touched.phone && fieldErrors.phone ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
              />
              {touched.phone && fieldErrors.phone && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`input-field mt-1 ${touched.password && fieldErrors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
              />
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-900">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`input-field mt-1 ${touched.confirmPassword && fieldErrors.confirmPassword ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
            aria-label={loading ? 'Creating account, please wait' : 'Create your account'}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <p className="text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
