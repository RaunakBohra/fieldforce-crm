import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Save, ArrowLeft } from 'lucide-react';
import { PageContainer, ContentSection, Card } from '../components/layout';

export function ProductForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    stock: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getProductCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.createProduct({
        name: formData.name,
        sku: formData.sku,
        description: formData.description || undefined,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      });

      if (response.success) {
        navigate('/products');
      } else {
        setError(response.error || 'Failed to create product');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ContentSection maxWidth="4xl">
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Add New Product</h1>
              <p className="text-neutral-600">Create a new product in your catalog</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 bg-white rounded-md hover:bg-neutral-50 border border-neutral-300"
            >
              <ArrowLeft size={20} />
              Back to Products
            </button>
          </div>
        </Card>

        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., PROD-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="NEW">+ Add New Category</option>
                </select>
                {formData.category === 'NEW' && (
                  <input
                    type="text"
                    placeholder="Enter new category name"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Product description..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-500 disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'Creating...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="flex-1 px-6 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
