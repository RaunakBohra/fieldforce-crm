import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Order } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeftIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  TruckIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await api.getOrder(id!);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order || !isManager) return;

    try {
      setActionLoading(true);
      const response = await api.updateOrderStatus(order.id, { status: newStatus as any });
      if (response.success && response.data) {
        setOrder(response.data);
        alert('Order status updated successfully');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;

    try {
      setActionLoading(true);
      const response = await api.cancelOrder(order.id, { reason: cancelReason });
      if (response.success && response.data) {
        setOrder(response.data);
        setShowCancelModal(false);
        setCancelReason('');
        alert('Order cancelled successfully');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-neutral-100 text-neutral-800';
      case 'PENDING':
        return 'bg-warn-100 text-warn-800';
      case 'APPROVED':
        return 'bg-primary-100 text-primary-800';
      case 'PROCESSING':
        return 'bg-primary-100 text-primary-800';
      case 'DISPATCHED':
        return 'bg-primary-100 text-primary-800';
      case 'SHIPPED':
        return 'bg-primary-100 text-primary-800';
      case 'DELIVERED':
        return 'bg-success-100 text-success-800';
      case 'CANCELLED':
        return 'bg-danger-100 text-danger-800';
      case 'REJECTED':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getNextActions = (currentStatus: string) => {
    const transitions: Record<string, Array<{ status: string; label: string; color: string }>> = {
      DRAFT: [
        { status: 'PENDING', label: 'Submit for Approval', color: 'bg-primary-600 hover:bg-primary-500' },
      ],
      PENDING: [
        { status: 'APPROVED', label: 'Approve', color: 'bg-success-600 hover:bg-success-500' },
        { status: 'REJECTED', label: 'Reject', color: 'bg-danger-600 hover:bg-danger-500' },
      ],
      APPROVED: [
        { status: 'DISPATCHED', label: 'Mark as Dispatched', color: 'bg-primary-600 hover:bg-primary-500' },
      ],
      DISPATCHED: [
        { status: 'DELIVERED', label: 'Mark as Delivered', color: 'bg-success-600 hover:bg-success-500' },
      ],
    };
    return transitions[currentStatus] || [];
  };

  const canEdit = order && ['DRAFT', 'PENDING'].includes(order.status);
  const canCancel = order && !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="text-primary-600 hover:text-primary-500"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const outstanding = order.totalAmount - totalPaid;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/orders')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{order.orderNumber}</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Created on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                Customer Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <UserIcon className="h-5 w-5 text-neutral-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{order.contact?.name}</p>
                    <p className="text-sm text-neutral-600">{order.contact?.contactType}</p>
                  </div>
                </div>
                {order.contact?.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-neutral-400 mr-3" />
                    <p className="text-sm text-neutral-900">{order.contact.phone}</p>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-neutral-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-900">{order.deliveryAddress}</p>
                      {order.deliveryCity && (
                        <p className="text-sm text-neutral-600">
                          {order.deliveryCity}
                          {order.deliveryState && `, ${order.deliveryState}`}
                          {order.deliveryPincode && ` - ${order.deliveryPincode}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{item.product.name}</p>
                            <p className="text-sm text-neutral-600">{item.product.sku}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-neutral-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-neutral-900">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                          ${Number(item.totalPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Notes
                </h2>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            {/* Cancellation Reason */}
            {order.cancellationReason && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-danger-900 mb-2">Cancellation Reason</h2>
                <p className="text-sm text-danger-700">{order.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-primary-600" />
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Total Amount</span>
                  <span className="text-sm font-medium text-neutral-900">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Paid</span>
                  <span className="text-sm font-medium text-success-600">
                    ${totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-neutral-200">
                  <span className="text-sm font-semibold text-neutral-900">Outstanding</span>
                  <span className={`text-sm font-bold ${outstanding > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                    ${outstanding.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Timeline */}
            {order.expectedDeliveryDate && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Delivery Timeline
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Expected Delivery</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                  {order.actualDeliveryDate && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Actual Delivery</p>
                      <p className="text-sm font-medium text-success-600">
                        {new Date(order.actualDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Edit Button */}
                {canEdit && (
                  <button
                    onClick={() => navigate(`/orders/${order.id}/edit`)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Order
                  </button>
                )}

                {/* Status Change Buttons (Manager only) */}
                {isManager && getNextActions(order.status).map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusChange(action.status)}
                    disabled={actionLoading}
                    className={`w-full flex items-center justify-center px-4 py-2 text-white rounded-lg transition-colors ${action.color} disabled:opacity-50`}
                  >
                    {action.status === 'APPROVED' && <CheckIcon className="h-5 w-5 mr-2" />}
                    {action.status === 'DISPATCHED' && <TruckIcon className="h-5 w-5 mr-2" />}
                    {action.status === 'DELIVERED' && <CheckIcon className="h-5 w-5 mr-2" />}
                    {action.label}
                  </button>
                ))}

                {/* Cancel Button */}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-500 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Cancel Order</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Please provide a reason for cancelling this order.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Cancellation Reason *
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                <option value="Customer request">Customer request</option>
                <option value="Out of stock">Out of stock</option>
                <option value="Pricing error">Pricing error</option>
                <option value="Duplicate order">Duplicate order</option>
                <option value="Delivery issues">Delivery issues</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason || actionLoading}
                className="flex-1 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-500 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
