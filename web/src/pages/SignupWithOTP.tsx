import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

type SignupStep = 'form' | 'otp-phone' | 'otp-email' | 'creating-account';

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'FIELD_REP' | 'MANAGER';
}

/**
 * Signup with OTP Verification (Backend Proxy)
 *
 * Flow:
 * 1. User fills signup form
 * 2. Verify phone via SMS OTP (backend API)
 * 3. Verify email via Email OTP (backend API)
 * 4. Create account in database
 * 5. Auto-login user
 */
export function SignupWithOTP() {
  const navigate = useNavigate();

  // Form state
  const [step, setStep] = useState<SignupStep>('form');
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'FIELD_REP',
  });

  // OTP state
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Handle form input changes
  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Step 1: Submit signup form → Move to phone OTP verification
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Password strength validation
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password) || !/[@$!%*?&]/.test(formData.password)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    // Format phone: remove spaces, ensure country code
    const phone = formData.phone.replace(/\s/g, '');
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    // Ensure phone has country code (add 91 for India if not present)
    const formattedPhone = phone.startsWith('91') || phone.startsWith('+91')
      ? phone.replace('+', '')
      : '91' + phone;

    setFormData(prev => ({ ...prev, phone: formattedPhone }));

    // Send phone OTP
    setLoading(true);
    try {
      const response = await api.sendOTP(formattedPhone, 4, 5);

      if (!response.success) {
        setError(response.error || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      console.log('✅ Phone OTP sent successfully');
      setStep('otp-phone');
      setLoading(false);
    } catch (err) {
      console.error('❌ Send phone OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      setLoading(false);
    }
  };

  // Step 2: Verify phone OTP
  const handleVerifyPhoneOTP = async () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.verifyOTP(formData.phone, otp);

      if (!response.success || !response.data?.verified) {
        setError(response.error || 'Invalid OTP');
        setLoading(false);
        return;
      }

      console.log('✅ Phone OTP verified successfully');
      setPhoneVerified(true);
      setOtp(''); // Clear OTP for next step

      // Send email OTP
      const emailOtpResponse = await api.sendOTP(formData.email, 4, 5);

      if (!emailOtpResponse.success) {
        setError(emailOtpResponse.error || 'Failed to send email OTP');
        setLoading(false);
        return;
      }

      console.log('✅ Email OTP sent successfully');
      setStep('otp-email');
      setLoading(false);
    } catch (err) {
      console.error('❌ Verify phone OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      setLoading(false);
    }
  };

  // Step 3: Verify email OTP
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
      console.error('❌ Verify email OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      setLoading(false);
    }
  };

  // Step 4: Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setOtp('');

    try {
      const identifier = step === 'otp-phone' ? formData.phone : formData.email;
      const response = await api.resendOTP(identifier);

      if (!response.success) {
        setError(response.error || 'Failed to resend OTP');
        setLoading(false);
        return;
      }

      console.log('✅ OTP resent successfully');
      setLoading(false);
    } catch (err) {
      console.error('❌ Resend OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
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
            {step === 'otp-phone' && 'Verify Phone Number'}
            {step === 'otp-email' && 'Verify Email Address'}
            {step === 'creating-account' && 'Creating Account...'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {step === 'form' && 'Join Field Force CRM'}
            {step === 'otp-phone' && 'Enter the OTP sent to your phone'}
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
          <form onSubmit={handleSubmitForm} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
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
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
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

        {/* Step 2: Phone OTP Verification */}
        {step === 'otp-phone' && (
          <div className="bg-white p-8 rounded-lg shadow space-y-6">
            {phoneVerified && (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
                ✅ Phone verified successfully
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-neutral-600">
                📱 Phone: <span className="font-medium text-neutral-900">{formData.phone}</span>
              </p>
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
              onClick={handleVerifyPhoneOTP}
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading || otp.length !== 4}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verifying...' : 'Verify Phone & Continue'}
            </button>

            <button
              onClick={handleResendOTP}
              className="btn-secondary w-full"
              disabled={loading}
            >
              Resend OTP
            </button>

            <button
              onClick={() => setStep('form')}
              className="btn-ghost w-full"
              disabled={loading}
            >
              Back to Form
            </button>
          </div>
        )}

        {/* Step 3: Email OTP Verification */}
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
              onClick={handleResendOTP}
              className="btn-secondary w-full"
              disabled={loading}
            >
              Resend OTP
            </button>

            <button
              onClick={() => {
                setStep('otp-phone');
                setOtp('');
              }}
              className="btn-ghost w-full"
              disabled={loading}
            >
              Back to Phone Verification
            </button>
          </div>
        )}

        {/* Step 4: Creating Account */}
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
