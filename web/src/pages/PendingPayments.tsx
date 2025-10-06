import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { PendingOrder } from '../services/api';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, TableSkeleton } from '../components/ui';
import { formatCurrency, getPriorityColor } from '../utils';

export default function PendingPayments() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await api.getPendingPayments();
      if (response.success && response.data) {
        setPendingOrders(response.data.pendingOrders);
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
      `Reminder would be sent to ${order.contact.name} (${order.contact.phone})\n\nPending: ${formatCurrency(order.pendingAmount)}\n\n(SMS/WhatsApp integration to be implemented)`
    );
  };


  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.pendingAmount, 0);
  const overdueCount = pendingOrders.filter((o) => o.daysPending > 30).length;

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Pending Payments</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Track and follow up on pending payments
              </p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-lg hover:bg-primary-700 hover:shadow-md transition-all min-h-[44px] shadow-sm"
            >
              <span className="font-medium">View All Payments</span>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 overflow-x-auto">
            <div className="grid grid-cols-3 gap-4 min-w-max">
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-600 mb-2">TOTAL PENDING ORDERS</div>
                <div className="text-2xl font-bold text-danger-600">{pendingOrders.length}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-600 mb-2">TOTAL PENDING AMOUNT</div>
                <div className="text-2xl font-bold text-warn-600">{formatCurrency(totalPendingAmount)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-neutral-600 mb-2">OVERDUE (&gt;30 DAYS)</div>
                <div className="text-2xl font-bold text-danger-600">{overdueCount}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Orders Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={8}
              headers={['Order #', 'Contact', 'Total', 'Paid', 'Pending', 'Days', 'Priority', 'Actions']}
            />
          ) : pendingOrders.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              <p className="text-lg font-medium">No pending payments</p>
              <p className="text-sm mt-1">All orders are fully paid!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <div>
                          <p className="font-medium">{order.contact.name}</p>
                          {order.contact.phone && (
                            <p className="text-xs text-neutral-400">{order.contact.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600">
                        {formatCurrency(order.totalPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-danger-600">
                        {formatCurrency(order.pendingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {order.daysPending} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={getPriorityColor(order.daysPending).label}
                          className={getPriorityColor(order.daysPending).color}
                          formatLabel={false}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/payments/new/${order.id}`)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Record Payment
                        </button>
                        <button
                          onClick={() => sendReminder(order)}
                          className="text-warn-600 hover:text-warn-700"
                        >
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentSection>
    </PageContainer>
  );
}
