import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '../components/Navigation';

interface PendingOrder {
  id: string;
  orderNumber: string;
  contact: { name: string; phone?: string };
  totalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  daysPending: number;
  createdAt: string;
}

export default function PendingPayments() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fieldforce-crm.raunakbohra.workers.dev'}/api/payments/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPendingOrders(data.data.pendingOrders);
      }
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = (order: PendingOrder) => {
    if (!order.contact.phone) {
      alert('No phone number available for this contact');
      return;
    }

    alert(
      `Reminder would be sent to ${order.contact.name} (${order.contact.phone})\n\nPending: ₹${order.pendingAmount.toLocaleString('en-IN')}\n\n(SMS/WhatsApp integration to be implemented)`
    );
  };

  const getPriorityBadge = (days: number) => {
    if (days > 30) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          HIGH
        </span>
      );
    } else if (days > 15) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        LOW
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending payments...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.pendingAmount, 0);
  const overdueCount = pendingOrders.filter((o) => o.daysPending > 30).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pending Payments</h1>
          <button
            onClick={() => navigate('/payments')}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-semibold"
          >
            View All Payments
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Pending Orders</p>
              <p className="text-3xl font-bold text-red-600">{pendingOrders.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pending Amount</p>
              <p className="text-3xl font-bold text-amber-600">
                {formatCurrency(totalPendingAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue (&gt;30 days)</p>
              <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>

        {/* Pending Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{order.contact.name}</p>
                        {order.contact.phone && (
                          <p className="text-xs text-gray-400">{order.contact.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(order.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatCurrency(order.pendingAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.daysPending} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(order.daysPending)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/payments/new/${order.id}`)}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        Record Payment
                      </button>
                      <button
                        onClick={() => sendReminder(order)}
                        className="text-amber-600 hover:text-amber-900"
                      >
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pendingOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No pending payments</p>
              <p className="text-sm mt-1">All orders are fully paid!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
