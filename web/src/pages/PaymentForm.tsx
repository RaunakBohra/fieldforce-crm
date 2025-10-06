import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '../components/Navigation';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  contact: { name: string };
  payments?: Array<{ amount: number }>;
}

export default function PaymentForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fieldforce-crm.raunakbohra.workers.dev'}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);

        // Pre-fill amount with remaining balance
        const totalPaid = data.data.payments?.reduce(
          (sum: number, p: { amount: number }) => sum + p.amount,
          0
        ) || 0;
        const remaining = data.data.totalAmount - totalPaid;
        setFormData({ ...formData, amount: remaining.toString() });
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError('Failed to load order details');
    }
  };

  const fetchCsrfToken = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fieldforce-crm.raunakbohra.workers.dev'}/api/csrf-token`);
    const data = await response.json();
    return data.csrfToken;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const csrfToken = await fetchCsrfToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fieldforce-crm.raunakbohra.workers.dev'}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          orderId,
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      if (data.success) {
        alert(`Payment recorded successfully! Payment #: ${data.data.paymentNumber}`);
        navigate('/payments');
      } else {
        throw new Error(data.error || 'Failed to record payment');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Record Payment</h1>

        {order && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-2">Order: {order.orderNumber}</h2>
            <p className="text-gray-600">Contact: {order.contact.name}</p>
            <p className="text-gray-600">
              Total: ₹{order.totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-gray-600">
              Status:{' '}
              <span
                className={`font-semibold ${
                  order.paymentStatus === 'PAID'
                    ? 'text-green-600'
                    : order.paymentStatus === 'PARTIAL'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {order.paymentStatus || 'UNPAID'}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="Transaction ID / Cheque No"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Recording Payment...' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
