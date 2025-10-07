import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Order } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { showToast } from '../components/ui';
import { validators } from '../utils/validation';

export default function PaymentForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMode: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.getOrder(orderId!);
      if (response.success && response.data) {
        setOrder(response.data);

        // Pre-fill amount with remaining balance
        const totalPaid = response.data.items?.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        ) || 0;
        const remaining = response.data.totalAmount - totalPaid;
        setFormData(prev => ({ ...prev, amount: remaining.toString() }));
      } else {
        setError(response.error || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      const err = error as Error;
      setError(err.message || 'Failed to load order details');
    }
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'amount':
        return validators.required(value, 'Amount') || validators.positiveNumber(value, 'Amount');
      case 'paymentMode':
        return validators.required(value, 'Payment mode');
      case 'paymentDate':
        return validators.required(value, 'Payment date');
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    errors.amount = validateField('amount', formData.amount);
    errors.paymentMode = validateField('paymentMode', formData.paymentMode);
    errors.paymentDate = validateField('paymentDate', formData.paymentDate);

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

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      setTouched({ amount: true, paymentMode: true, paymentDate: true });
      return;
    }

    setLoading(true);

    try {
      const response = await api.createPayment({
        orderId: orderId!,
        amount: parseFloat(formData.amount),
        paymentMode: formData.paymentMode as 'CASH' | 'CHEQUE' | 'NEFT' | 'UPI' | 'CARD' | 'OTHER',
        paymentDate: new Date(formData.paymentDate).toISOString(),
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      });

      if (response.success && response.data) {
        showToast.success('Payment recorded successfully', `Payment #: ${response.data.paymentNumber}`);
        navigate('/payments');
      } else {
        setError(response.error || 'Failed to record payment');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ContentSection maxWidth="2xl">
        <h1 className="text-3xl font-bold text-neutral-900 mb-6">Record Payment</h1>

        {order && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Order: {order.orderNumber}</h2>
            {order.contact && <p className="text-neutral-600">Contact: {order.contact.name}</p>}
            <p className="text-neutral-600">
              Total: ₹{order.totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-neutral-600">
              Status:{' '}
              <span
                className={`font-semibold ${
                  order.paymentStatus === 'PAID'
                    ? 'text-success-600'
                    : order.paymentStatus === 'PARTIAL'
                    ? 'text-warn-600'
                    : 'text-danger-600'
                }`}
              >
                {order.paymentStatus || 'UNPAID'}
              </span>
            </p>
          </Card>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 error-message">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                onBlur={() => handleBlur('amount')}
                className={`input-field ${touched.amount && fieldErrors.amount ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                required
              />
              {touched.amount && fieldErrors.amount && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Payment Mode *
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => handleChange('paymentMode', e.target.value)}
                onBlur={() => handleBlur('paymentMode')}
                className={`select-field ${touched.paymentMode && fieldErrors.paymentMode ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                required
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Card</option>
              </select>
              {touched.paymentMode && fieldErrors.paymentMode && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.paymentMode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleChange('paymentDate', e.target.value)}
                onBlur={() => handleBlur('paymentDate')}
                className={`input-field ${touched.paymentDate && fieldErrors.paymentDate ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                required
              />
              {touched.paymentDate && fieldErrors.paymentDate && (
                <p className="mt-1 text-sm text-danger-600">{fieldErrors.paymentDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="Transaction ID / Cheque No"
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="textarea-field"
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Recording Payment...' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
          </form>
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
