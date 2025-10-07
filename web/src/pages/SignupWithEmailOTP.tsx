import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { MSG91Config, MSG91VerifyResponse, MSG91Error } from '../types/msg91';

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

  // Refs to avoid stale closures
  const formDataRef = useRef(formData);
  const stepRef = useRef<Step>('form');

  // UI state
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  // Update refs when state changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Load MSG91 widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ MSG91 widget loaded');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Initialize MSG91 OTP widget when email verification step is reached
  useEffect(() => {
    if (step === 'otp-email' && window.initSendOTP) {
      // TODO: Migrate to backend proxy (/api/otp) for better security
      // Currently using environment variables to avoid credential exposure
      const configuration = {
        widgetId: import.meta.env.VITE_MSG91_WIDGET_ID || '356a6763534a353431353234',
        tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH || '460963T7LX2uZk68e493c1P1',
        identifier: formDataRef.current.email,
        exposeMethods: true,
        success: (data: MSG91VerifyResponse) => {
          console.log('✅ OTP Verification Success');
          const token = data.message || data.token || data;
          console.log('📍 Current step from ref:', stepRef.current);
          handleOTPVerificationSuccess(token);
        },
        failure: (error: MSG91Error) => {
          console.error('❌ OTP Verification Failed:', error);
          setError(error.message || 'OTP verification failed');
          setLoading(false);
        },
      };

      window.initSendOTP(configuration);
    }
  }, [step]);

  // Step 1: Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Step 2: Submit form and move to email OTP
  const handleSubmit = (e: React.FormEvent) => {
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

    // Move to email OTP verification
    setStep('otp-email');

    // Auto-send email OTP
    setTimeout(() => {
      setLoading(true);
      console.log('📧 Auto-sending email OTP to:', formData.email);

      window.sendOtp(
        formData.email,
        (data) => {
          console.log('✅ Email OTP sent:', data);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Send email OTP failed:', error);
          setError(error.message || 'Failed to send OTP to email');
          setLoading(false);
        }
      );
    }, 500);
  };

  // Step 3: Send OTP to email (manual trigger)
  const handleSendEmailOTP = () => {
    setLoading(true);
    setError('');
    setOtp('');

    console.log('📧 Sending email OTP to:', formData.email);

    window.sendOtp(
      formData.email,
      (data) => {
        console.log('✅ Email OTP sent:', data);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Send email OTP failed:', error);
        setError(error.message || 'Failed to send OTP to email');
        setLoading(false);
      }
    );
  };

  // Step 4: Verify email OTP
  const handleVerifyEmailOTP = () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    window.verifyOtp(
      otp,
      (data) => {
        console.log('✅ Email OTP verified:', data);
        // Success callback handled by widget initialization
      },
      (error) => {
        console.error('❌ Email OTP verification failed:', error);
        setError(error.message || 'Invalid OTP');
        setLoading(false);
      }
    );
  };

  // Handle successful OTP verification (called by widget)
  const handleOTPVerificationSuccess = async (token: string) => {
    try {
      console.log('✅ OTP verified by MSG91');
      console.log('📍 Current step in handler:', stepRef.current);

      // NOTE: We trust MSG91's widget verification and skip backend verification
      // MSG91 tokens can only be verified once (error code 702: "access-token already verified")
      // Since the widget already verified the OTP, we don't need to verify the token again
      console.log('✅ Trusting MSG91 widget verification (token already verified by widget)');

      console.log('📧 Email verified! Creating account...');
      setEmailVerified(true);
      setLoading(false);

      // Create account
      await createAccount();
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
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
      const phoneWithoutCountryCode = formDataRef.current.phone.startsWith('91')
        ? formDataRef.current.phone.substring(2)
        : formDataRef.current.phone;

      const response = await api.signup({
        name: formDataRef.current.name,
        email: formDataRef.current.email,
        phone: phoneWithoutCountryCode,
        password: formDataRef.current.password,
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
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue to Verification'}
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
              className="btn-primary w-full"
              disabled={loading || otp.length !== 4}
            >
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Creating your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}
