import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact, Product } from '../services/api';
import { Save, ArrowLeft, Plus, Trash2, Scan } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { isOnline, saveOfflineOrder, type OfflineOrder } from '../utils/offlineStorage';
import { BarcodeScanner } from '../components/BarcodeScanner';

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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Form state
  const [contactId, setContactId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const fetchContacts = async () => {
    try {
      const params: any = { page: 1, limit: 50 };
      if (contactSearch) params.search = contactSearch;
      const response = await api.getContacts(params);
      if (response.success && response.data) {
        setContacts(response.data.contacts);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const params: any = { page: 1, limit: 50, isActive: true };
      if (productSearch) params.search = productSearch;
      const response = await api.getProducts(params);
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

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setError('');

    try {
      const response = await api.lookupProductByBarcode(barcode);
      if (response.success && response.data) {
        const product = response.data;

        // Check if product already exists in items
        const existingIndex = items.findIndex(item => item.productId === product.id);

        if (existingIndex >= 0) {
          // Increment quantity
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += 1;
          setItems(updatedItems);
        } else {
          // Add new item
          setItems([...items, {
            productId: product.id,
            product: product,
            quantity: 1,
            price: product.price,
          }]);
        }

        // Show success feedback
        alert(`Added: ${product.name}`);
      } else {
        setError('Product not found for this barcode');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to lookup product');
    }
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
      // Check if online
      if (!isOnline()) {
        // Save offline
        const offlineOrder: OfflineOrder = {
          id: `offline-${Date.now()}`,
          contactId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          total: calculateTotal(),
          status: 'DRAFT',
          createdAt: Date.now(),
        };

        await saveOfflineOrder(offlineOrder);
        alert('📱 Offline mode: Order saved locally. Will sync when connection is restored.');
        navigate('/orders');
        return;
      }

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
    <PageContainer>
      <ContentSection maxWidth="5xl">
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Create New Order</h1>
              <p className="text-neutral-600">Add products and create an order for a contact</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 bg-white rounded-md hover:bg-neutral-50 border border-neutral-300"
            >
              <ArrowLeft size={20} />
              Back to Orders
            </button>
          </div>
        </Card>

        {error && (
          <div className="mb-6 error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Selection */}
          <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Select Contact</h2>
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="input-field mb-3"
              />
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="select-field"
                required
              >
                <option value="">Choose a contact...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.contactType})
                  </option>
                ))}
              </select>
              {contacts.length === 0 && contactSearch && (
                <p className="mt-2 text-sm text-neutral-500">No contacts found matching "{contactSearch}"</p>
              )}
            </Card>

            {/* Order Items */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-md hover:bg-accent-500"
                  >
                    <Scan size={18} />
                    Scan Product
                  </button>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-500"
                  >
                    <Plus size={18} />
                    Add Product
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input-field mb-4"
              />

              {items.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No products added yet. Click "Add Product" to begin.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border border-neutral-200 rounded-md">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="select-field"
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
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Subtotal</label>
                        <div className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md font-semibold text-neutral-900">
                          ₹{(item.quantity * item.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-danger-600 hover:text-danger-500 p-2"
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
                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-neutral-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Additional Info */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Additional Information</h2>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="textarea-field"
                placeholder="Add any special instructions or notes..."
              />
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                <Save size={20} />
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
      </ContentSection>

      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </PageContainer>
  );
}
