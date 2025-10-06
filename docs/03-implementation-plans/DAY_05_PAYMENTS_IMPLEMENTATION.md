# Day 5: Payment Tracking Module

**Goal**: Implement payment recording, tracking, reminders, and analytics

**Duration**: 8 hours (9:00 AM - 5:30 PM)

---

## 9:00 AM - 10:00 AM: Payments Database & Backend Setup

### Tasks:
- [ ] Create Prisma schema for payments table
- [ ] Run migration
- [ ] Create payments controller

### Commands:
```bash
cd api

# Update schema.prisma - add Payment model
npx prisma migrate dev --name add_payments_table

# Verify
npx prisma studio
```

### Files to Create:

**api/src/controllers/payments.ts**:
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /payments - Record payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, paymentMode, paymentDate, referenceNumber, notes } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!amount || !paymentMode) {
      return res.status(400).json({ error: 'Amount and payment mode are required' });
    }

    if (!['cash', 'upi', 'neft', 'rtgs', 'cheque', 'card'].includes(paymentMode)) {
      return res.status(400).json({ error: 'Invalid payment mode' });
    }

    // If orderId provided, verify order exists
    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
    }

    // Generate payment number
    const paymentCount = await prisma.payment.count();
    const paymentNumber = `PAY-${String(paymentCount + 1).padStart(6, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        orderId,
        amount,
        paymentMode,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        referenceNumber,
        notes,
        recordedBy: userId,
        status: 'completed'
      },
      include: {
        order: {
          include: {
            contact: { select: { name: true } }
          }
        }
      }
    });

    // If linked to order, update order payment status
    if (order) {
      // Get total payments for this order
      const payments = await prisma.payment.findMany({
        where: { orderId, status: 'completed' }
      });

      const totalPaid = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      // Update order payment status
      let paymentStatus = 'unpaid';
      if (totalPaid >= parseFloat(order.totalAmount.toString())) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus }
      });
    }

    res.status(201).json({ payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

// GET /payments - List all payments
export const getPayments = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentMode, startDate, endDate, status } = req.query;

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (paymentMode) where.paymentMode = paymentMode;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            contact: { select: { name: true, type: true } }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// GET /payments/:id - Get single payment
export const getPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            contact: true,
            items: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// GET /payments/stats/summary - Payment statistics
export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { status: 'completed' };
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const [totalPayments, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        select: { amount: true, paymentMode: true }
      })
    ]);

    const totalAmount = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    // Payment mode breakdown
    const paymentModes = payments.reduce((acc, p) => {
      const mode = p.paymentMode;
      if (!acc[mode]) acc[mode] = 0;
      acc[mode] += parseFloat(p.amount.toString());
      return acc;
    }, {} as Record<string, number>);

    // Outstanding orders (approved but not fully paid)
    const outstandingOrders = await prisma.order.findMany({
      where: {
        status: 'approved',
        OR: [
          { paymentStatus: 'unpaid' },
          { paymentStatus: 'partial' }
        ]
      },
      select: { totalAmount: true }
    });

    const totalOutstanding = outstandingOrders.reduce(
      (sum, o) => sum + parseFloat(o.totalAmount.toString()),
      0
    );

    res.json({
      totalPayments,
      totalAmount,
      averagePayment: totalPayments > 0 ? (totalAmount / totalPayments).toFixed(2) : 0,
      paymentModes,
      totalOutstanding,
      outstandingCount: outstandingOrders.length
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// GET /payments/pending - Get pending payments (orders without full payment)
export const getPendingPayments = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'approved',
        OR: [
          { paymentStatus: 'unpaid' },
          { paymentStatus: 'partial' }
        ]
      },
      include: {
        contact: { select: { name: true, phone: true, type: true } },
        user: { select: { name: true } },
        payments: {
          where: { status: 'completed' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate pending amount for each order
    const pendingOrders = orders.map(order => {
      const totalPaid = order.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      const totalAmount = parseFloat(order.totalAmount.toString());
      const pendingAmount = totalAmount - totalPaid;

      return {
        ...order,
        totalPaid,
        pendingAmount,
        daysPending: Math.floor(
          (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      };
    });

    res.json({ pendingOrders });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
};
```

**api/src/routes/payments.ts**:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createPayment,
  getPayments,
  getPayment,
  getPaymentStats,
  getPendingPayments
} from '../controllers/payments';

const router = Router();

router.use(authenticateToken);

router.post('/', createPayment);
router.get('/', getPayments);
router.get('/stats/summary', getPaymentStats);
router.get('/pending', getPendingPayments);
router.get('/:id', getPayment);

export default router;
```

### Update server.ts:
```typescript
import paymentsRoutes from './routes/payments';
app.use('/payments', paymentsRoutes);
```

### Success Criteria:
- [ ] Payments table created
- [ ] Payment recording works
- [ ] Order payment status updates correctly
- [ ] Pending payments calculation accurate

---

## 10:00 AM - 11:30 AM: Frontend Payment Recording Page

### Files to Create:

**web/src/pages/PaymentCreate.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function PaymentCreate() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMode: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
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
      const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrder(data.order);

      // Pre-fill amount with remaining balance
      const totalPaid = data.order.payments?.reduce(
        (sum: number, p: any) => sum + parseFloat(p.amount),
        0
      ) || 0;
      const remaining = parseFloat(data.order.totalAmount) - totalPaid;
      setFormData({ ...formData, amount: remaining.toString() });
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      const data = await response.json();
      alert('Payment recorded successfully! Payment #: ' + data.payment.paymentNumber);
      navigate('/payments');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Record Payment</h1>

          {order && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-2">Order: {order.orderNumber}</h2>
              <p className="text-gray-600">Contact: {order.contact.name}</p>
              <p className="text-gray-600">Total: ₹{order.totalAmount}</p>
              <p className="text-gray-600">
                Status: <span className={`font-semibold ${
                  order.paymentStatus === 'paid' ? 'text-green-600' :
                  order.paymentStatus === 'partial' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {order.paymentStatus?.toUpperCase() || 'UNPAID'}
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
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
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
                className="flex-1 bg-primary-800 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold"
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
    </Layout>
  );
}
```

### Success Criteria:
- [ ] Form loads with order details
- [ ] Amount pre-filled with remaining balance
- [ ] All payment modes available
- [ ] Date picker working
- [ ] Payment recording successful

---

## 11:30 AM - 1:00 PM: Payments List & Pending Payments

### Files to Create:

**web/src/pages/Payments.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  referenceNumber?: string;
  order?: {
    orderNumber: string;
    contact: { name: string };
  };
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    paymentMode: '',
    startDate: '',
    endDate: ''
  });
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/payments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPayments(data.payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const response = await fetch(`http://localhost:5000/payments/stats/summary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <button
              onClick={() => navigate('/payments/new')}
              className="bg-primary-800 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold"
            >
              + Record Payment
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-3xl font-bold text-primary-800">{stats.totalPayments}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Avg Payment</p>
                <p className="text-2xl font-bold text-blue-600">₹{parseFloat(stats.averagePayment).toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₹{stats.totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stats.outstandingCount} orders</p>
              </div>
            </div>
          )}

          {/* Payment Mode Breakdown */}
          {stats?.paymentModes && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Payment Mode Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(stats.paymentModes).map(([mode, amount]: [string, any]) => (
                  <div key={mode} className="text-center">
                    <p className="text-sm text-gray-600 uppercase">{mode}</p>
                    <p className="text-xl font-bold text-primary-800">₹{amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={filter.paymentMode}
                onChange={(e) => setFilter({ ...filter, paymentMode: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Payment Modes</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="neft">NEFT</option>
                <option value="rtgs">RTGS</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.order?.orderNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.order?.contact.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 uppercase">
                        {payment.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No payments found.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

---

## 2:00 PM - 3:00 PM: Pending Payments / Payment Reminders Page

### Files to Create:

**web/src/pages/PendingPayments.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

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
      const response = await fetch('http://localhost:5000/payments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPendingOrders(data.pendingOrders);
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

    // In production, this would trigger SMS/WhatsApp
    alert(`Reminder sent to ${order.contact.name} (${order.contact.phone})\n\nPending: ₹${order.pendingAmount.toLocaleString()}`);
  };

  const getPriorityBadge = (days: number) => {
    if (days > 30) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">HIGH</span>;
    } else if (days > 15) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">MEDIUM</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">LOW</span>;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Payments</h1>

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
                  ₹{pendingOrders.reduce((sum, o) => sum + o.pendingAmount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue (>30 days)</p>
                <p className="text-3xl font-bold text-red-600">
                  {pendingOrders.filter(o => o.daysPending > 30).length}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingOrders.map((order) => (
                  <tr key={order.id}>
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
                      ₹{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ₹{order.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      ₹{order.pendingAmount.toLocaleString()}
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
                        className="text-primary-800 hover:text-teal-900"
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

            {pendingOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No pending payments. All orders are fully paid!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Update Layout navigation:
```typescript
<Link to="/payments/pending" className="hover:bg-primary-700 px-3 py-2 rounded">
  Pending Payments
</Link>
```

---

## 3:00 PM - 4:00 PM: Add Payment Links Throughout App

### Update Orders page to show payment status:
```typescript
// Add to Orders.tsx
<td className="px-6 py-4">
  {order.paymentStatus === 'paid' ? (
    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
      PAID
    </span>
  ) : order.paymentStatus === 'partial' ? (
    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
      PARTIAL
    </span>
  ) : (
    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
      UNPAID
    </span>
  )}
</td>

// Add "Record Payment" button for unpaid/partial orders
{order.paymentStatus !== 'paid' && (
  <button
    onClick={() => navigate(`/payments/new/${order.id}`)}
    className="text-green-600 hover:text-green-900 ml-4"
  >
    Record Payment
  </button>
)}
```

---

## 4:00 PM - 4:30 PM: Testing & Bug Fixes

### Manual Test Checklist:
- [ ] Record payment for an order
- [ ] Verify order payment status updates
- [ ] Test partial payment (pay less than total)
- [ ] Test full payment
- [ ] Check payment statistics accuracy
- [ ] Test pending payments page
- [ ] Test payment mode filter
- [ ] Test date range filter

---

## 4:30 PM - 5:00 PM: Git Commit & Documentation

### Commands:
```bash
git add .
git commit -m "Day 5: Implement payment tracking module

- Add payments table with multi-mode support
- Create payment recording API
- Implement automatic order payment status update
- Build payment recording form
- Create payments history page with stats
- Add pending payments dashboard
- Implement payment reminders interface
- Add payment mode breakdown analytics

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## 5:00 PM - 5:30 PM: Week 1 Review & Week 2 Planning

### Week 1 Achievements:
- [x] Day 1: Authentication & Project Setup
- [x] Day 2: Contacts CRUD Module
- [x] Day 3: Visit Tracking with GPS
- [x] Day 4: Order Management
- [x] Day 5: Payment Tracking

### Week 1 Metrics:
- **Total Files Created**: 40+ files
- **Lines of Code**: ~4,000 lines
- **API Endpoints**: 25+ endpoints
- **Database Tables**: 8 tables
- **Features Complete**: 5 core modules

### Week 2 Preview:
- Day 6-7: Dashboard & Analytics
- Day 8-9: Mobile Optimization (PWA)
- Day 10: Reports & Export (CSV/PDF)

---

## End of Day 5

**Total Time**: 8 hours
**Status**: Payment tracking complete ✓ | Week 1 MVP Complete ✓
**Next**: Week 2 - Dashboard, Analytics & Mobile Optimization
