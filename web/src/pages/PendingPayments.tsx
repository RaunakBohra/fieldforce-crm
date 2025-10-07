import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { PendingOrder } from '../services/api';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, TableSkeleton, showToast } from '../components/ui';
import { formatCurrency, getPriorityColor } from '../utils';
import { CheckCircle } from 'lucide-react';

export default function PendingPayments() {
  const isMobile = useIsMobile();
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
      showToast.error('No phone number available for this contact');
      return;
    }

    showToast.success(
      `Reminder sent to ${order.contact.name} - Pending: ${formatCurrency(order.pendingAmount)}`
    );
    // Note: SMS/WhatsApp integration to be implemented
  };


  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.pendingAmount, 0);
  const overdueCount = pendingOrders.filter((o) => o.daysPending > 30).length;

  // Mobile Card View Component
  const PendingOrderMobileCard = ({ order }: { order: PendingOrder }) => (
    <div className="p-4 border-b border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-neutral-900">{order.orderNumber}</h3>
          <p className="text-sm text-neutral-600 mt-0.5">{order.contact.name}</p>
          {order.contact.phone && (
            <p className="text-xs text-neutral-500">{order.contact.phone}</p>
          )}
        </div>
        <StatusBadge
          label={getPriorityColor(order.daysPending).label}
          className={getPriorityColor(order.daysPending).color}
          formatLabel={false}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-neutral-600">Total:</p>
          <p className="font-semibold text-neutral-900">{formatCurrency(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-neutral-600">Paid:</p>
          <p className="font-semibold text-success-600">{formatCurrency(order.totalPaid)}</p>
        </div>
        <div>
          <p className="text-neutral-600">Pending:</p>
          <p className="font-semibold text-danger-600">{formatCurrency(order.pendingAmount)}</p>
        </div>
        <div>
          <p className="text-neutral-600">Days Pending:</p>
          <p className="font-semibold text-neutral-900">{order.daysPending} days</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/payments/new/${order.id}`)}
          className="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          Record Payment
        </button>
        <button
          onClick={() => sendReminder(order)}
          className="px-3 py-2 text-sm font-medium text-warn-700 bg-warn-50 hover:bg-warn-100 rounded-lg transition-colors"
        >
          Send Reminder
        </button>
      </div>
    </div>
  );

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="page-header">
            <div className="flex-1">
              <h1 className="page-title">Pending Payments</h1>
              <p className="page-subtitle">
                Track and follow up on pending payments
              </p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="btn-primary"
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
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <CheckCircle className="w-16 h-16 text-success-500 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">All Caught Up!</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                Great job! There are no pending payments at the moment. All orders are fully paid.
              </p>
              <button onClick={() => navigate('/payments')} className="btn-primary">
                <span>View All Payments</span>
              </button>
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="bg-white">
              {pendingOrders.map((order) => (
                <PendingOrderMobileCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            // Desktop Table View
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
