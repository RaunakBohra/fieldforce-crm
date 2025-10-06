import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact, Product } from '../services/api';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';

interface OrderItem {
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
}

export function OrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [contactId, setContactId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchContacts();
    fetchProducts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.getContacts({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        setContacts(response.data.contacts);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts({ page: 1, limit: 1000, isActive: true });
      if (response.success && response.data) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill price when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].price = product.price;
        updated[index].product = product;
      }
    }

    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactId) {
      setError('Please select a contact');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.createOrder({
        contactId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        notes,
      });

      if (response.success) {
        navigate('/orders');
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <Navigation />
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Order</h1>
              <p className="text-gray-600">Add products and create an order for a contact</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-300"
            >
              <ArrowLeft size={20} />
              Back to Orders
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Contact</h2>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">Choose a contact...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.contactType})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products added yet. Click "Add Product" to begin.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-md">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                          required
                        >
                          <option value="">Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ₹{product.price}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-semibold text-gray-900">
                          ₹{(item.quantity * item.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-teal-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Add any special instructions or notes..."
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 disabled:opacity-50 font-semibold"
              >
                <Save size={20} />
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
