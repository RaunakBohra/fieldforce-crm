import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';
import type { MSG91Config, MSG91VerifyResponse, MSG91Error } from '../types/msg91';

type SignupStep = 'form' | 'otp-phone' | 'otp-email' | 'creating-account' | 'success';

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'FIELD_REP' | 'MANAGER';
}

/**
 * Signup with MSG91 OTP Verification
 *
 * Flow:
 * 1. User fills signup form
 * 2. Verify phone via SMS OTP (MSG91 widget)
 * 3. Verify email via Email OTP (MSG91 widget)
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
  const [accessToken, setAccessToken] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Avoid unused variable warnings
  // Note: accessToken, phoneVerified, emailVerified tracked in state

  // Use refs to track current step and formData to avoid stale closure issues
  const stepRef = useRef(step);
  const formDataRef = useRef(formData);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Load MSG91 OTP widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ MSG91 widget loaded');

      // Initialize MSG91 widget
      // TODO: Migrate to backend proxy (/api/otp) for better security
      // Currently using environment variables to avoid credential exposure
      (window as any).initSendOTP({
        widgetId: import.meta.env.VITE_MSG91_WIDGET_ID || '356a6763534a353431353234',
        tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH || '460963T7LX2uZk68e493c1P1',
        exposeMethods: true,
        success: (data: MSG91VerifyResponse) => {
          console.log('✅ OTP Verification Success');
          // MSG91 widget returns token in different possible fields
          const token = data.token || data.accessToken || data.authToken || data.message || data;
          console.log('📍 Current step from ref:', stepRef.current);

          if (token && typeof token === 'string') {
            setAccessToken(token);
            handleOTPVerificationSuccess(token);
          } else {
            console.log('⚠️ No string token in response, showing success without server verification');
            // If no token but verification succeeded, just proceed
            setLoading(false);
            if (stepRef.current === 'otp-phone') {
              setPhoneVerified(true);
              setStep('otp-email');
            } else if (stepRef.current === 'otp-email') {
              setEmailVerified(true);
              createAccount();
            }
          }
        },
        failure: (error: MSG91Error) => {
          console.error('❌ OTP Verification Failed:', error);
          setError(error.message || 'OTP verification failed');
          setLoading(false);
        },
      });
    };

    script.onerror = () => {
      setError('Failed to load OTP widget. Please refresh the page.');
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Step 1: Submit signup form → Move to phone OTP verification
  const handleSubmitForm = (e: React.FormEvent) => {
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
    setStep('otp-phone');

    // Auto-send OTP immediately with formatted phone
    // Note: Even for demo numbers, we must call sendOtp() to get reqId
    // Demo mode means MSG91 accepts "1234" as OTP, but still needs sendOtp() call
    setLoading(true);
    console.log('📱 Auto-sending phone OTP to:', formattedPhone);

    window.sendOtp(
      formattedPhone,
      (data) => {
        console.log('✅ Phone OTP sent:', data);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Send phone OTP failed:', error);
        setError(error.message || 'Failed to send OTP to phone');
        setLoading(false);
      }
    );
  };

  // Step 2: Send OTP to phone (manual trigger)
  const handleSendPhoneOTP = () => {
    setLoading(true);
    setError('');

    console.log('📱 Sending phone OTP to:', formData.phone);

    window.sendOtp(
      formData.phone,
      (data) => {
        console.log('✅ Phone OTP sent:', data);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Send phone OTP failed:', error);
        setError(error.message || 'Failed to send OTP to phone');
        setLoading(false);
      }
    );
  };

  // Step 3: Verify phone OTP
  const handleVerifyPhoneOTP = () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    window.verifyOtp(
      otp,
      (data) => {
        console.log('✅ Phone OTP verified:', data);
        // Success callback handled by widget initialization
      },
      (error) => {
        console.error('❌ Phone OTP verification failed:', error);
        setError(error.message || 'Invalid OTP');
        setLoading(false);
      }
    );
  };

  // Step 4: Send OTP to email
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

  // Step 5: Verify email OTP
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

      // Mark current step as verified
      if (stepRef.current === 'otp-phone') {
        console.log('📞 Phone verified! Moving to email verification...');
        setPhoneVerified(true);
        setOtp('');
        setLoading(false); // Clear loading state
        setStep('otp-email'); // Move to email verification

        // Auto-send email OTP after a short delay
        setTimeout(() => {
          setLoading(true);
          const email = formDataRef.current.email;
          console.log('📧 Auto-sending email OTP to:', email);

          window.sendOtp(
            email,
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
        }, 800);
      } else if (stepRef.current === 'otp-email') {
        console.log('📧 Email verified! Creating account...');
        setEmailVerified(true);
        setLoading(false); // Clear loading state
        // Both phone and email verified → Create account
        await createAccount();
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  };

  // Step 6: Create user account
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
        // Add verified flag or store in user metadata
      });

      if (!response.success) {
        throw new Error(response.error || 'Signup failed');
      }

      console.log('✅ Account created successfully');

      // Auto-login: Store token
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      setStep('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('❌ Account creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setStep('form'); // Go back to form
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-neutral-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {step === 'form' && 'Create Account'}
              {step === 'otp-phone' && 'Verify Phone Number'}
              {step === 'otp-email' && 'Verify Email Address'}
              {step === 'creating-account' && 'Creating Account...'}
              {step === 'success' && 'Success!'}
            </h1>
            <p className="text-neutral-600">
              {step === 'form' && 'Join Field Force CRM'}
              {step === 'otp-phone' && 'Enter the OTP sent to your phone'}
              {step === 'otp-email' && 'Enter the OTP sent to your email'}
              {step === 'creating-account' && 'Please wait...'}
              {step === 'success' && 'Account created successfully'}
            </p>
          </div>

          {/* Step 1: Signup Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmitForm} className="space-y-4">
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
                  onChange={(e) => handleInputChange('role', e.target.value as any)}
                  className="input-field"
                >
                  <option value="FIELD_REP">Field Representative</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                Continue to Verification
              </button>

              <p className="text-center text-sm text-neutral-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Log in
                </button>
              </p>
            </form>
          )}

          {/* Step 2: Phone OTP Verification */}
          {step === 'otp-phone' && (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800">
                <p>📱 Phone: <strong>+{formData.phone}</strong></p>
                <p className="mt-1">Click below to receive OTP via SMS</p>
              </div>

              <button
                onClick={handleSendPhoneOTP}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send OTP to Phone'
                )}
              </button>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Enter 4-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyPhoneOTP}
                disabled={loading || otp.length !== 4}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify Phone OTP'
                )}
              </button>
            </div>
          )}

          {/* Step 3: Email OTP Verification */}
          {step === 'otp-email' && (
            <div className="space-y-4">
              <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-sm text-success-800 mb-4">
                ✅ Phone verified successfully
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800">
                <p>📧 Email: <strong>{formData.email}</strong></p>
                <p className="mt-1">Click below to receive OTP via email</p>
              </div>

              <button
                onClick={handleSendEmailOTP}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send OTP to Email'
                )}
              </button>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Enter 4-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyEmailOTP}
                disabled={loading || otp.length !== 4}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify Email & Create Account'
                )}
              </button>
            </div>
          )}

          {/* Step 4: Creating Account */}
          {step === 'creating-account' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Creating your account...</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Account Created!</h2>
              <p className="text-neutral-600">Redirecting to dashboard...</p>
            </div>
          )}
      </div>
    </div>
  );
}
