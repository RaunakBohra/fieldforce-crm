import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

type Step = 'form' | 'otp-email' | 'creating-account';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'FIELD_REP' | 'MANAGER';
}

export default function SignupWithEmailOTP() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'FIELD_REP',
  });

  // UI state
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  // Step 1: Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Step 2: Submit form and move to email OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password) || !/[@$!%*?&]/.test(formData.password)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    // Send email OTP
    setLoading(true);
    try {
      const response = await api.sendOTP(formData.email, 4, 5);

      if (!response.success) {
        setError(response.error || 'Failed to send OTP to email');
        setLoading(false);
        return;
      }

      console.log('✅ Email OTP sent successfully');
      setStep('otp-email');
      setLoading(false);
    } catch (err) {
      console.error('❌ Send email OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      setLoading(false);
    }
  };

  // Step 3: Send OTP to email (manual trigger)
  const handleSendEmailOTP = async () => {
    setLoading(true);
    setError('');
    setOtp('');

    try {
      const response = await api.sendOTP(formData.email, 4, 5);

      if (!response.success) {
        setError(response.error || 'Failed to send OTP to email');
        setLoading(false);
        return;
      }

      console.log('✅ Email OTP sent successfully');
      setLoading(false);
    } catch (err) {
      console.error('❌ Send email OTP failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP to email');
      setLoading(false);
    }
  };

  // Step 4: Verify email OTP
  const handleVerifyEmailOTP = async () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.verifyOTP(formData.email, otp);

      if (!response.success || !response.data?.verified) {
        setError(response.error || 'Invalid OTP');
        setLoading(false);
        return;
      }

      console.log('✅ Email OTP verified successfully');
      setEmailVerified(true);

      // Create account
      await createAccount();
    } catch (err) {
      console.error('❌ Email OTP verification failed:', err);
      setError(err instanceof Error ? err.message : 'Invalid OTP');
      setLoading(false);
    }
  };

  // Step 5: Create user account
  const createAccount = async () => {
    try {
      setStep('creating-account');
      setLoading(true);

      console.log('👤 Creating user account...');

      // Remove country code from phone (backend expects 10 digits)
      const phoneWithoutCountryCode = formData.phone.startsWith('91')
        ? formData.phone.substring(2)
        : formData.phone;

      const response = await api.signup({
        name: formData.name,
        email: formData.email,
        phone: phoneWithoutCountryCode,
        password: formData.password,
      });

      if (!response.success) {
        throw new Error(response.error || 'Signup failed');
      }

      console.log('✅ Account created successfully');

      // Auto-login: Store token
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      // Redirect to dashboard
      console.log('🎉 Redirecting to dashboard...');
      navigate('/');
    } catch (err) {
      console.error('❌ Account creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">
            {step === 'form' && 'Create Account'}
            {step === 'otp-email' && 'Verify Email Address'}
            {step === 'creating-account' && 'Creating Account...'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {step === 'form' && 'Join Field Force CRM'}
            {step === 'otp-email' && 'Enter the OTP sent to your email'}
            {step === 'creating-account' && 'Please wait while we set up your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="9999999999 (without country code)"
                  required
                  pattern="[0-9]{10}"
                  title="Enter 10-digit phone number"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter 10-digit mobile number (India)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input-field"
                  placeholder="e.g., MyPass@123"
                  required
                  minLength={8}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Must include: uppercase, lowercase, number, special char (@$!%*?&)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as 'FIELD_REP' | 'MANAGER')}
                  className="input-field"
                >
                  <option value="FIELD_REP">Field Representative</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending OTP...' : 'Continue to Verification'}
            </button>

            <p className="text-center text-sm text-neutral-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Log in
              </button>
            </p>
          </form>
        )}

        {/* Step 2: Email OTP Verification */}
        {step === 'otp-email' && (
          <div className="bg-white p-8 rounded-lg shadow space-y-6">
            {emailVerified && (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
                ✅ Email verified successfully
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-neutral-600">
                📧 Email: <span className="font-medium text-neutral-900">{formData.email}</span>
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-600 mb-4">
                Click below to receive OTP via email
              </p>
              <button
                onClick={handleSendEmailOTP}
                className="btn-secondary w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP to Email'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Enter 4-digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="input-field text-center text-2xl tracking-widest"
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
              />
            </div>

            <button
              onClick={handleVerifyEmailOTP}
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading || otp.length !== 4}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verifying...' : 'Verify Email & Create Account'}
            </button>

            <button
              onClick={() => setStep('form')}
              className="btn-secondary w-full"
              disabled={loading}
            >
              Back to Form
            </button>
          </div>
        )}

        {/* Step 3: Creating Account */}
        {step === 'creating-account' && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">Creating your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}
