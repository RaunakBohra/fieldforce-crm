import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { api } from '../services/api';
import type { Order, OrderStats } from '../services/api';
import { ShoppingCart, Eye, XCircle, Plus } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatusBadge, Pagination, TableSkeleton } from '../components/ui';
import { formatCurrency, formatDate, getOrderStatusColor, getPaymentStatusColor } from '../utils';

export function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const listRef = useRef<any>(null);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 100; // Increased for virtual scrolling

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
        // Enable virtual scrolling if we have more than 50 items
        setUseVirtualScrolling(response.data.orders.length > 50);
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

  // OrderRow component for virtual scrolling
  const OrderRow = ({ index, style, ariaAttributes }: any) => {
    const order = orders[index];
    if (!order) return null;

    return (
      <div style={style} className="border-b border-neutral-200 hover:bg-neutral-50" {...ariaAttributes}>
        <div className="grid grid-cols-8 gap-4 px-6 py-4">
          <div className="col-span-1 flex items-center">
            <div className="text-sm font-medium text-neutral-900">{order.orderNumber}</div>
          </div>
          <div className="col-span-1 flex flex-col justify-center">
            <div className="text-sm font-medium text-neutral-900">{order.contact?.name}</div>
            <div className="text-sm text-neutral-500">{order.contact?.contactType}</div>
          </div>
          <div className="col-span-1 flex items-center text-sm text-neutral-900">
            {order.items.length}
          </div>
          <div className="col-span-1 flex items-center text-sm font-semibold text-neutral-900">
            {formatCurrency(Number(order.totalAmount))}
          </div>
          <div className="col-span-1 flex items-center">
            <StatusBadge
              label={order.status}
              className={getOrderStatusColor(order.status)}
              formatLabel
            />
          </div>
          <div className="col-span-1 flex items-center">
            <StatusBadge
              label={(order as any).paymentStatus || 'UNPAID'}
              className={getPaymentStatusColor((order as any).paymentStatus || 'UNPAID')}
              formatLabel
            />
          </div>
          <div className="col-span-1 flex items-center text-sm text-neutral-500">
            {formatDate(order.createdAt)}
          </div>
          <div className="col-span-1 flex items-center justify-end gap-2">
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
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <ContentSection>
        {/* Header */}
        <Card className="border-b border-neutral-200 rounded-none">
          <div className="page-header">
            <div className="flex-1">
              <h1 className="page-title">Orders</h1>
              <p className="page-subtitle">
                Manage customer orders
              </p>
            </div>
            <button
              onClick={() => navigate('/orders/new')}
              className="btn-primary"
            >
              <Plus className="icon-btn" />
              <span className="font-medium">Create Order</span>
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-5 gap-4 min-w-max">
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Total Orders</div>
                    <div className="text-2xl font-bold text-neutral-900">{stats.totalOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Pending</div>
                    <div className="text-2xl font-bold text-warn-600">{stats.pendingOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Approved</div>
                    <div className="text-2xl font-bold text-primary-600">{stats.approvedOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Delivered</div>
                    <div className="text-2xl font-bold text-success-600">{stats.deliveredOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Total Revenue</div>
                    <div className="text-2xl font-bold text-primary-600">{formatCurrency(Number(stats.totalRevenue))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="mt-6 border border-neutral-200 shadow-sm">
          <h2 className="card-title">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field"
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
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="mt-4 error-message">
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
            <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
              <ShoppingCart className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Orders Yet</h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                Start managing your sales by creating your first order. Track orders from creation to delivery.
              </p>
              <button onClick={() => navigate('/orders/new')} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Create Order</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-8 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200">
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Order #</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Items</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Payment</div>
                <div className="col-span-1 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</div>
                <div className="col-span-1 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</div>
              </div>

              {/* Table Body - Virtual Scrolling or Regular */}
              {useVirtualScrolling ? (
                <List
                  listRef={listRef}
                  defaultHeight={600}
                  rowCount={orders.length}
                  rowHeight={80}
                  rowComponent={OrderRow}
                  rowProps={{}}
                />
              ) : (
                <div className="bg-white">
                  {orders.map((order, index) => (
                    <OrderRow key={order.id} index={index} style={{}} />
                  ))}
                </div>
              )}
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
