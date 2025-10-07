import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validators } from '../utils/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'email':
        return validators.required(value, 'Email') || validators.email(value);
      case 'password':
        return validators.required(value, 'Password');
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.email = validateField('email', email);
    errors.password = validateField('password', password);

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string, value: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, value);
    if (error) {
      setFieldErrors({ ...fieldErrors, [field]: error });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (fieldErrors.email) {
      setFieldErrors({ ...fieldErrors, email: '' });
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors({ ...fieldErrors, password: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg" role="main">
        <div>
          <h1 className="text-3xl font-bold text-center text-primary-800">
            Field Force CRM
          </h1>
          <p className="mt-2 text-center text-neutral-600">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-label="Login form">
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
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                className={`input-field mt-1 ${touched.email && fieldErrors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => handleBlur('email', email)}
              />
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className={`input-field mt-1 ${touched.password && fieldErrors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur('password', password)}
              />
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
            aria-label={loading ? 'Signing in, please wait' : 'Sign in to your account'}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup-otp" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
