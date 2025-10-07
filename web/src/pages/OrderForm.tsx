import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact, Product } from '../services/api';
import { Save, ArrowLeft, Plus, Trash2, Scan } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';
import { isOnline, saveOfflineOrder, type OfflineOrder } from '../utils/offlineStorage';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Select, showToast } from '../components/ui';
import { validators } from '../utils/validation';

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

  // Form state
  const [contactId, setContactId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchContacts();
    fetchProducts();
  }, []);

  const fetchContacts = async () => {
    try {
      const params: any = { page: 1, limit: 100 };
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
      const params: any = { page: 1, limit: 100, isActive: true };
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
    // Clear items error when adding a new item
    if (fieldErrors.items) {
      setFieldErrors({ ...fieldErrors, items: '' });
    }
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    // Re-validate items after removal
    if (touched.items) {
      const error = validateField('items', updated);
      if (error) {
        setFieldErrors({ ...fieldErrors, items: error });
      } else {
        const newErrors = { ...fieldErrors };
        delete newErrors.items;
        setFieldErrors(newErrors);
      }
    }
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

    // Clear items error when updating
    if (fieldErrors.items) {
      setFieldErrors({ ...fieldErrors, items: '' });
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'contactId':
        return validators.required(value, 'Contact');
      case 'items':
        if (!value || value.length === 0) {
          return 'Please add at least one product';
        }
        // Validate each item
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (!item.productId) return `Product is required for item ${i + 1}`;
          if (!item.quantity || item.quantity < 1) return `Quantity must be at least 1 for item ${i + 1}`;
          if (!item.price || item.price <= 0) return `Price must be greater than 0 for item ${i + 1}`;
        }
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    errors.contactId = validateField('contactId', contactId);
    errors.items = validateField('items', items);

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    let value;
    if (field === 'contactId') value = contactId;
    else if (field === 'items') value = items;

    const error = validateField(field, value);
    if (error) {
      setFieldErrors({ ...fieldErrors, [field]: error });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  };

  const handleContactChange = (value: string) => {
    setContactId(value);
    if (fieldErrors.contactId) {
      setFieldErrors({ ...fieldErrors, contactId: '' });
    }
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
        showToast.success(`Added: ${product.name}`);
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
    setError('');

    // Validate form
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      setTouched({ contactId: true, items: true });
      return;
    }

    setLoading(true);

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
        showToast.info('Offline mode', 'Order saved locally. Will sync when connection is restored.');
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
        showToast.success('Order created successfully');
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
              <Select
                value={contactId}
                onChange={(value) => handleContactChange(String(value))}
                options={contacts.map((c) => ({
                  id: c.id,
                  label: c.name,
                  sublabel: `${c.contactType}${c.city ? ` • ${c.city}` : ''}`,
                }))}
                placeholder="Search and select contact..."
                loading={loading}
                error={touched.contactId && fieldErrors.contactId ? fieldErrors.contactId : ''}
                required
                aria-label="Contact selection"
                onCreate={(query) => {
                  navigate(`/contacts/new?name=${encodeURIComponent(query)}`);
                }}
              />
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

              {touched.items && fieldErrors.items && items.length === 0 && (
                <p className="mb-4 text-sm text-danger-600">{fieldErrors.items}</p>
              )}

              {items.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No products added yet. Click "Add Product" to begin.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border border-neutral-200 rounded-md">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Product</label>
                        <Select
                          value={item.productId}
                          onChange={(value) => updateItem(index, 'productId', String(value))}
                          options={products.map((p) => ({
                            id: p.id,
                            label: p.name,
                            sublabel: `₹${p.price}${p.stock !== undefined ? ` • Stock: ${p.stock}` : ''}`,
                            disabled: p.stock === 0,
                          }))}
                          placeholder="Search and select product..."
                          required
                          aria-label={`Product selection for item ${index + 1}`}
                        />
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
                          aria-label="Remove item"
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
