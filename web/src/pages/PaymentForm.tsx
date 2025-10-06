import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Order } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        alert(`Payment recorded successfully! Payment #: ${response.data.paymentNumber}`);
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
            <div className="mb-4 p-3 bg-danger-100 text-danger-700 rounded-lg">
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Payment Mode *
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
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
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-500 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Recording Payment...' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="flex-1 bg-neutral-300 text-neutral-700 py-2 px-4 rounded-lg hover:bg-neutral-400 font-semibold"
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
