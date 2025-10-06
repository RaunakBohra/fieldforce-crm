import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Order, OrderStats } from '../services/api';
import { ShoppingCart, Eye, XCircle, Plus } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatCard, StatusBadge, Pagination, TableSkeleton } from '../components/ui';
import { formatCurrency, formatDate, getOrderStatusColor, getPaymentStatusColor } from '../utils';

export function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        limit: number;
        status?: string;
      } = {
        page: currentPage,
        limit,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await api.getOrders(params);
      if (response.success && response.data) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getOrderStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCancelOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;

    try {
      const response = await api.cancelOrder(id);
      if (response.success) {
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to cancel order');
    }
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Orders</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Manage customer orders
              </p>
            </div>
            <button
              onClick={() => navigate('/orders/new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Order
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                valueColor="text-neutral-900"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="Pending"
                value={stats.pendingOrders}
                valueColor="text-warn-600"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="Approved"
                value={stats.approvedOrders}
                valueColor="text-primary-600"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="Delivered"
                value={stats.deliveredOrders}
                valueColor="text-success-600"
                className="bg-neutral-50 shadow-none"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(Number(stats.totalRevenue))}
                valueColor="text-primary-600"
                className="bg-neutral-50 shadow-none"
              />
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Orders Table */}
        <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={8}
              headers={['Order #', 'Customer', 'Items', 'Amount', 'Status', 'Payment', 'Date', 'Actions']}
            />
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              <ShoppingCart className="mx-auto text-neutral-400 mb-4" size={48} />
              <p className="text-neutral-500 mb-4">No orders found</p>
              <button
                onClick={() => navigate('/orders/new')}
                className="bg-primary-800 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create First Order
              </button>
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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">{order.contact?.name}</div>
                        <div className="text-sm text-neutral-500">{order.contact?.contactType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {order.items.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={order.status}
                          className={getOrderStatusColor(order.status)}
                          formatLabel
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={(order as any).paymentStatus || 'UNPAID'}
                          className={getPaymentStatusColor((order as any).paymentStatus || 'UNPAID')}
                          formatLabel
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="text-primary-600 hover:text-primary-700"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </button>
                          {(order.status === 'PENDING' || order.status === 'APPROVED') && (
                            <button
                              onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                              className="text-danger-600 hover:text-danger-500"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4 inline" />
                            </button>
                          )}
                          {(order.status === 'APPROVED' || order.status === 'DELIVERED') && (order as any).paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => navigate(`/payments/new/${order.id}`)}
                              className="text-success-600 hover:text-success-900 text-xs underline"
                              title="Record Payment"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </ContentSection>
    </PageContainer>
  );
}
