# Day 4: Order Management Module

**Goal**: Implement order creation, product catalog, approval workflow, and order history

**Duration**: 8 hours (9:00 AM - 5:30 PM)

---

## 9:00 AM - 10:00 AM: Products & Orders Database Schema

### Tasks:
- [ ] Create Prisma schemas for products, orders, and order_items tables
- [ ] Run migrations
- [ ] Seed sample products

### Commands:
```bash
cd api

# Update schema.prisma - add Product, Order, OrderItem models
npx prisma migrate dev --name add_orders_tables

# Create seed file
touch prisma/seed.ts
```

### Files to Create:

**prisma/seed.ts**:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed products
  const products = [
    { name: 'Product A', sku: 'PROD-A-001', price: 100, category: 'Category 1', stock: 500 },
    { name: 'Product B', sku: 'PROD-B-001', price: 200, category: 'Category 1', stock: 300 },
    { name: 'Product C', sku: 'PROD-C-001', price: 150, category: 'Category 2', stock: 400 },
    { name: 'Product D', sku: 'PROD-D-001', price: 250, category: 'Category 2', stock: 200 },
    { name: 'Product E', sku: 'PROD-E-001', price: 300, category: 'Category 3', stock: 150 }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }

  console.log('✓ Products seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run seed:
```bash
npx tsx prisma/seed.ts
```

### Success Criteria:
- [ ] products, orders, order_items tables created
- [ ] 5 sample products seeded
- [ ] Foreign key constraints working

---

## 10:00 AM - 11:30 AM: Backend Orders API

### Files to Create:

**api/src/controllers/products.ts**:
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /products - List all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// GET /products/:id - Get single product
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};
```

**api/src/controllers/orders.ts**:
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /orders - Create order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { contactId, items, notes } = req.body;
    const userId = (req as any).user.userId;

    // Validation
    if (!contactId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Contact and items are required' });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal
      });
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        contactId,
        userId,
        totalAmount,
        status: 'pending_approval',
        notes,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true,
        contact: { select: { name: true, type: true } },
        user: { select: { name: true } }
      }
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// GET /orders - List all orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, contactId, userId, startDate, endDate } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        contact: { select: { name: true, type: true } },
        user: { select: { name: true, role: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// GET /orders/:id - Get single order
export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        contact: true,
        user: { select: { name: true, role: true } },
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// PUT /orders/:id/approve - Approve order
export const approveOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only managers and admins can approve
    if (!['manager', 'admin', 'super_admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only managers and admins can approve orders' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      },
      include: {
        contact: true,
        items: true
      }
    });

    res.json({ order, message: 'Order approved successfully' });
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
};

// PUT /orders/:id/reject - Reject order
export const rejectOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!['manager', 'admin', 'super_admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only managers and admins can reject orders' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedBy: userId,
        rejectionReason: reason
      }
    });

    res.json({ order, message: 'Order rejected' });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
};

// GET /orders/stats/summary - Get order statistics
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [totalOrders, pendingOrders, approvedOrders, rejectedOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'pending_approval' } }),
      prisma.order.count({ where: { ...where, status: 'approved' } }),
      prisma.order.count({ where: { ...where, status: 'rejected' } })
    ]);

    // Calculate total revenue
    const approvedOrdersData = await prisma.order.findMany({
      where: { ...where, status: 'approved' },
      select: { totalAmount: true }
    });

    const totalRevenue = approvedOrdersData.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount.toString()),
      0
    );

    res.json({
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalRevenue,
      approvalRate: totalOrders > 0 ? ((approvedOrders / totalOrders) * 100).toFixed(1) + '%' : '0%'
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
```

**api/src/routes/products.ts**:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getProducts, getProduct } from '../controllers/products';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/:id', getProduct);

export default router;
```

**api/src/routes/orders.ts**:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createOrder,
  getOrders,
  getOrder,
  approveOrder,
  rejectOrder,
  getOrderStats
} from '../controllers/orders';

const router = Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats/summary', getOrderStats);
router.get('/:id', getOrder);
router.put('/:id/approve', approveOrder);
router.put('/:id/reject', rejectOrder);

export default router;
```

### Update server.ts:
```typescript
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';

app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
```

### Test Commands:
```bash
# Test create order
curl -X POST http://localhost:5000/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "contact-id",
    "items": [
      {"productId": "product-id", "quantity": 10}
    ]
  }'

# Test approve order
curl -X PUT http://localhost:5000/orders/order-id/approve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Success Criteria:
- [ ] Products API returns all products
- [ ] Order creation calculates total correctly
- [ ] Order approval requires manager role
- [ ] Order statistics accurate

---

## 11:30 AM - 1:00 PM: Frontend Order Creation Page

### Files to Create:

**web/src/pages/OrderCreate.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export default function OrderCreate() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [contact, setContact] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContact();
    fetchProducts();
  }, []);

  const fetchContact = async () => {
    try {
      const response = await fetch(`http://localhost:5000/contacts/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setContact(data.contact);
    } catch (error) {
      console.error('Failed to fetch contact:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const addProduct = (product: Product) => {
    const existing = selectedItems.find(item => item.productId === product.id);

    if (existing) {
      setSelectedItems(
        selectedItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          lineTotal: product.price
        }
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(item => item.productId !== productId));
    } else {
      setSelectedItems(
        selectedItems.map(item =>
          item.productId === productId
            ? { ...item, quantity, lineTotal: quantity * item.unitPrice }
            : item
        )
      );
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Please add at least one product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contactId,
          items: selectedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      alert('Order created successfully! Order Number: ' + data.order.orderNumber);
      navigate('/orders');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Order</h1>

          {contact && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-2">{contact.name}</h2>
              <p className="text-gray-600">Type: {contact.type}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Catalog */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Product Catalog</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                      <p className="text-sm font-semibold text-teal-600">₹{product.price}</p>
                    </div>
                    <button
                      onClick={() => addProduct(product)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>

              {selectedItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No items added yet. Select products from the catalog.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">₹{item.unitPrice} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                        <p className="font-semibold text-teal-600 w-24 text-right">₹{item.lineTotal}</p>
                        <button
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-teal-600">₹{calculateTotal()}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows={3}
                      placeholder="Add any notes about this order..."
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-semibold"
                    >
                      {loading ? 'Creating Order...' : 'Create Order'}
                    </button>
                    <button
                      onClick={() => navigate('/orders')}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Success Criteria:
- [ ] Product catalog loads
- [ ] Add product to order
- [ ] Update quantity
- [ ] Remove product
- [ ] Total calculates correctly
- [ ] Order creation successful

---

## 2:00 PM - 3:30 PM: Orders List & Details Pages

### Files to Create:

**web/src/pages/Orders.tsx**:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Order {
  id: string;
  orderNumber: string;
  contact: { name: string; type: string };
  user: { name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:5000/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/orders/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-teal-600">{stats.totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approvedOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-3xl font-bold text-amber-600">{stats.approvalRate}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-600">
                      ₹{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No orders found.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Success Criteria:
- [ ] Orders list displays correctly
- [ ] Stats cards calculate accurately
- [ ] Status filter works
- [ ] Status badges color-coded

---

## 3:30 PM - 4:30 PM: Order Approval Interface

### Add to OrderDetails page for managers/admins:
```typescript
const handleApprove = async () => {
  if (!confirm('Are you sure you want to approve this order?')) return;

  try {
    await fetch(`http://localhost:5000/orders/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    alert('Order approved successfully');
    fetchOrder();
  } catch (error) {
    console.error('Failed to approve order:', error);
  }
};

const handleReject = async () => {
  const reason = prompt('Enter rejection reason:');
  if (!reason) return;

  try {
    await fetch(`http://localhost:5000/orders/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });

    alert('Order rejected');
    fetchOrder();
  } catch (error) {
    console.error('Failed to reject order:', error);
  }
};
```

---

## 4:30 PM - 5:00 PM: Git Commit & Documentation

### Commands:
```bash
git add .
git commit -m "Day 4: Implement order management module

- Add products, orders, order_items tables
- Seed sample products
- Create order creation API with total calculation
- Implement order approval workflow (manager/admin only)
- Build order creation page with product catalog
- Create orders list with statistics
- Add order approval/rejection interface
- Generate order numbers automatically

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## 5:00 PM - 5:30 PM: Day 4 Review & Day 5 Planning

### Review Checklist:
- [ ] Product catalog working
- [ ] Order creation calculates total correctly
- [ ] Order approval requires correct permissions
- [ ] Order statistics accurate
- [ ] All CRUD operations functional

### Day 5 Preview:
Tomorrow we will implement:
- Payment tracking module
- Record payments against orders
- Payment reminders
- Payment history and analytics
- Multi-payment mode support (cash, UPI, NEFT, cheque)

---

## End of Day 4

**Total Time**: 8 hours
**Status**: Order management complete with approval workflow
**Next**: Day 5 - Payment Tracking Module
